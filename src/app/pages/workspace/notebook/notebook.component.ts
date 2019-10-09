import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { isNil } from 'lodash';
import { Subject } from 'rxjs';
import { distinctUntilKeyChanged, takeUntil } from 'rxjs/operators';

import { MessageListener, MessageListenersManager } from '@zeppelin/core';
import { Permissions } from '@zeppelin/interfaces';
import { InterpreterBindingItem, MessageReceiveDataTypeMap, Note, OP, RevisionListItem } from '@zeppelin/sdk';
import {
  MessageService,
  NoteStatusService,
  NoteVarShareService,
  SecurityService,
  TicketService
} from '@zeppelin/services';

import { NotebookParagraphComponent } from './paragraph/paragraph.component';

@Component({
  selector: 'zeppelin-notebook',
  templateUrl: './notebook.component.html',
  styleUrls: ['./notebook.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotebookComponent extends MessageListenersManager implements OnInit, OnDestroy {
  @ViewChildren(NotebookParagraphComponent) listOfNotebookParagraphComponent: QueryList<NotebookParagraphComponent>;
  private destroy$ = new Subject();
  note: Note['note'];
  permissions: Permissions;
  isOwner = true;
  noteRevisions: RevisionListItem[] = [];
  currentRevision: string;
  collaborativeMode = false;
  revisionView = false;
  collaborativeModeUsers = [];
  isNoteDirty = false;
  saveTimer = null;
  interpreterBindings: InterpreterBindingItem[] = [];
  activatedExtension: 'interpreter' | 'permissions' | 'revisions' | 'hide' = 'hide';

  @MessageListener(OP.NOTE)
  getNote(data: MessageReceiveDataTypeMap[OP.NOTE]) {
    const note = data.note;
    if (isNil(note)) {
      this.router.navigate(['/']).then();
    } else {
      this.note = note;
      const { paragraphId } = this.activatedRoute.snapshot.params;
      if (paragraphId) {
        this.note = this.cleanParagraphExcept(paragraphId);
        this.initializeLookAndFeel();
      } else {
        this.initializeLookAndFeel();
        this.getInterpreterBindings();
        this.getPermissions();
        this.note.config.personalizedMode =
          this.note.config.personalizedMode === undefined ? 'false' : this.note.config.personalizedMode;
      }
      this.cdr.markForCheck();
    }
  }

  @MessageListener(OP.INTERPRETER_BINDINGS)
  loadInterpreterBindings(data: MessageReceiveDataTypeMap[OP.INTERPRETER_BINDINGS]) {
    this.interpreterBindings = data.interpreterBindings;
    if (!this.interpreterBindings.some(item => item.selected)) {
      this.activatedExtension = 'interpreter';
    }
    this.cdr.markForCheck();
  }

  @MessageListener(OP.PARAGRAPH_REMOVED)
  removeParagraph(data: MessageReceiveDataTypeMap[OP.PARAGRAPH_REMOVED]) {
    const { paragraphId } = this.activatedRoute.snapshot.params;
    if (paragraphId || this.revisionView) {
      return;
    }
    this.note.paragraphs = this.note.paragraphs.filter(p => p.id !== data.id);
    this.cdr.markForCheck();
  }

  @MessageListener(OP.PARAGRAPH_ADDED)
  addParagraph(data: MessageReceiveDataTypeMap[OP.PARAGRAPH_ADDED]) {
    const { paragraphId } = this.activatedRoute.snapshot.params;
    if (paragraphId || this.revisionView) {
      return;
    }
    this.note.paragraphs.splice(data.index, 0, data.paragraph).map(p => {
      return {
        ...p,
        focus: p.id === data.paragraph.id
      };
    });
    this.note.paragraphs = [...this.note.paragraphs];
    this.cdr.markForCheck();
    // TODO focus on paragraph
  }

  @MessageListener(OP.SAVE_NOTE_FORMS)
  saveNoteForms(data: MessageReceiveDataTypeMap[OP.SAVE_NOTE_FORMS]) {
    this.note.noteForms = data.formsData.forms;
    this.note.noteParams = data.formsData.params;
  }

  @MessageListener(OP.NOTE_REVISION)
  getNoteRevision(data: MessageReceiveDataTypeMap[OP.NOTE_REVISION]) {
    const note = data.note;
    if (isNil(note)) {
      this.router.navigate(['/']).then();
    } else {
      this.note = data.note;
      this.initializeLookAndFeel();
      this.cdr.markForCheck();
    }
  }

  @MessageListener(OP.SET_NOTE_REVISION)
  setNoteRevision() {
    const { noteId } = this.activatedRoute.snapshot.params;
    this.router.navigate(['/notebook', noteId]).then();
  }

  @MessageListener(OP.PARAGRAPH_MOVED)
  moveParagraph(data: MessageReceiveDataTypeMap[OP.PARAGRAPH_MOVED]) {
    if (!this.revisionView) {
      const movedPara = this.note.paragraphs.find(p => p.id === data.id);
      if (movedPara) {
        const listOfRestPara = this.note.paragraphs.filter(p => p.id !== data.id);
        this.note.paragraphs = [...listOfRestPara.slice(0, data.index), movedPara, ...listOfRestPara.slice(data.index)];
        this.cdr.markForCheck();
      }
    }
  }

  @MessageListener(OP.COLLABORATIVE_MODE_STATUS)
  getCollaborativeModeStatus(data: MessageReceiveDataTypeMap[OP.COLLABORATIVE_MODE_STATUS]) {
    this.collaborativeMode = Boolean(data.status);
    this.collaborativeModeUsers = data.users;
    this.cdr.markForCheck();
  }

  @MessageListener(OP.PATCH_PARAGRAPH)
  patchParagraph() {
    this.collaborativeMode = true;
    this.cdr.markForCheck();
  }

  @MessageListener(OP.NOTE_UPDATED)
  noteUpdated(data: MessageReceiveDataTypeMap[OP.NOTE_UPDATED]) {
    if (data.name !== this.note.name) {
      this.note.name = data.name;
    }
    this.note.config = data.config;
    this.note.info = data.info;
    this.initializeLookAndFeel();
    this.cdr.markForCheck();
  }

  @MessageListener(OP.LIST_REVISION_HISTORY)
  listRevisionHistory(data: MessageReceiveDataTypeMap[OP.LIST_REVISION_HISTORY]) {
    this.noteRevisions = data.revisionList;
    if (this.noteRevisions) {
      if (this.noteRevisions.length === 0 || this.noteRevisions[0].id !== 'Head') {
        this.noteRevisions.splice(0, 0, { id: 'Head', message: 'Head' });
      }
      const { revisionId } = this.activatedRoute.snapshot.params;
      if (revisionId) {
        this.currentRevision = this.noteRevisions.find(r => r.id === revisionId).message;
      } else {
        this.currentRevision = 'Head';
      }
    }
    this.cdr.markForCheck();
  }

  saveParagraph(id: string) {
    this.listOfNotebookParagraphComponent
      .toArray()
      .find(p => p.paragraph.id === id)
      .saveParagraph();
  }

  killSaveTimer() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  startSaveTimer() {
    this.killSaveTimer();
    this.isNoteDirty = true;
    this.saveTimer = setTimeout(() => {
      this.saveNote();
    }, 10000);
  }

  saveNote() {
    if (this.note && this.note.paragraphs && this.listOfNotebookParagraphComponent) {
      this.listOfNotebookParagraphComponent.toArray().forEach(p => {
        p.saveParagraph();
      });
      this.isNoteDirty = null;
      this.cdr.markForCheck();
    }
  }

  getInterpreterBindings() {
    this.messageService.getInterpreterBindings(this.note.id);
  }

  getPermissions() {
    this.securityService.getPermissions(this.note.id).subscribe(data => {
      this.permissions = data;
      this.isOwner = !(
        this.permissions.owners.length && this.permissions.owners.indexOf(this.ticketService.ticket.principal) < 0
      );
      this.cdr.markForCheck();
    });
  }

  get viewOnly(): boolean {
    return this.noteStatusService.viewOnly(this.note);
  }

  initializeLookAndFeel() {
    this.note.config.looknfeel = this.note.config.looknfeel || 'default';
    if (this.note.paragraphs && this.note.paragraphs[0]) {
      this.note.paragraphs[0].focus = true;
    }
  }

  cleanParagraphExcept(paragraphId) {
    const targetParagraph = this.note.paragraphs.find(p => p.id === paragraphId);
    const config = targetParagraph.config || {};
    config.editorHide = true;
    config.tableHide = false;
    const paragraphs = [{ ...targetParagraph, config }];
    return { ...this.note, paragraphs };
  }

  setAllParagraphTableHide(tableHide: boolean) {
    this.listOfNotebookParagraphComponent.forEach(p => p.setTableHide(tableHide));
  }

  setAllParagraphEditorHide(editorHide: boolean) {
    this.listOfNotebookParagraphComponent.forEach(p => p.setEditorHide(editorHide));
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    public messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private noteStatusService: NoteStatusService,
    private noteVarShareService: NoteVarShareService,
    private ticketService: TicketService,
    private securityService: SecurityService,
    private router: Router
  ) {
    super(messageService);
  }

  ngOnInit() {
    this.activatedRoute.params
      .pipe(
        takeUntil(this.destroy$),
        distinctUntilKeyChanged('noteId')
      )
      .subscribe(() => {
        this.noteVarShareService.clear();
      });
    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe(param => {
      const { noteId, revisionId } = param;
      if (revisionId) {
        this.messageService.noteRevision(noteId, revisionId);
      } else {
        this.messageService.getNote(noteId);
      }
      this.revisionView = !!revisionId;
      this.cdr.markForCheck();
      this.messageService.listRevisionHistory(noteId);
      // TODO scroll to current paragraph
    });
    this.revisionView = !!this.activatedRoute.snapshot.params.revisionId;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.killSaveTimer();
    this.saveNote();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
