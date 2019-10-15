import { DragDropModule } from '@angular/cdk/drag-drop';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  NzButtonModule,
  NzCheckboxModule,
  NzDividerModule,
  NzDropDownModule,
  NzFormModule,
  NzGridModule,
  NzIconModule,
  NzInputModule,
  NzNoAnimationModule,
  NzPopconfirmModule,
  NzPopoverModule,
  NzProgressModule,
  NzRadioModule,
  NzSelectModule,
  NzSwitchModule,
  NzToolTipModule
} from 'ng-zorro-antd';
import { NzCodeEditorModule } from 'ng-zorro-antd/code-editor';
import { NzResizableModule } from 'ng-zorro-antd/resizable';

import { ShareModule } from '@zeppelin/share';

import { VisualizationModule } from 'src/app/visualizations/visualization.module';
import { NotebookAddParagraphComponent } from './add-paragraph/add-paragraph.component';
import { NotebookInterpreterBindingComponent } from './interpreter-binding/interpreter-binding.component';
import { NotebookParagraphCodeEditorComponent } from './paragraph/code-editor/code-editor.component';
import { NotebookParagraphControlComponent } from './paragraph/control/control.component';
import { NotebookParagraphDynamicFormsComponent } from './paragraph/dynamic-forms/dynamic-forms.component';
import { NotebookParagraphFooterComponent } from './paragraph/footer/footer.component';
import { NotebookParagraphComponent } from './paragraph/paragraph.component';
import { NotebookParagraphProgressComponent } from './paragraph/progress/progress.component';
import { NotebookParagraphResultComponent } from './paragraph/result/result.component';
import { NotebookPermissionsComponent } from './permissions/permissions.component';
import { NotebookRevisionsComparatorComponent } from './revisions-comparator/revisions-comparator.component';

import { NotebookActionBarComponent } from './action-bar/action-bar.component';
import { NotebookRoutingModule } from './notebook-routing.module';
import { NotebookComponent } from './notebook.component';
import { NotebookShareModule } from './share/share.module';

@NgModule({
  declarations: [
    NotebookComponent,
    NotebookActionBarComponent,
    NotebookInterpreterBindingComponent,
    NotebookPermissionsComponent,
    NotebookRevisionsComparatorComponent,
    NotebookParagraphComponent,
    NotebookAddParagraphComponent,
    NotebookParagraphCodeEditorComponent,
    NotebookParagraphResultComponent,
    NotebookParagraphProgressComponent,
    NotebookParagraphFooterComponent,
    NotebookParagraphControlComponent,
    NotebookParagraphDynamicFormsComponent
  ],
  imports: [
    CommonModule,
    PortalModule,
    NotebookRoutingModule,
    ShareModule,
    VisualizationModule,
    NotebookShareModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzNoAnimationModule,
    NzToolTipModule,
    NzPopconfirmModule,
    NzFormModule,
    NzPopoverModule,
    NzInputModule,
    FormsModule,
    ReactiveFormsModule,
    NzDividerModule,
    NzCheckboxModule,
    NzProgressModule,
    NzSwitchModule,
    NzSelectModule,
    NzGridModule,
    NzRadioModule,
    DragDropModule,
    NzResizableModule,
    NzCodeEditorModule
  ]
})
export class NotebookModule {}
