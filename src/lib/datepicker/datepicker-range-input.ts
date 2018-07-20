/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  Input,
} from '@angular/core';
import { MatDatepicker } from './datepicker';



@Component({
  selector: 'mat-datepicker-range',
  moduleId: module.id,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input #start matInput />
    <input #end matInput />
  `,
})
export class MatDatepickerRange<D> {
  @ViewChild('start') start: ElementRef<HTMLInputElement>;
  @ViewChild('end') end: ElementRef<HTMLInputElement>;

  @Input()
  set matDatepicker(value: MatDatepicker<D>) {
    this._matDatepicker = value;
    this._matDatepicker._registerInputRange(this);
  }
  private _matDatepicker: MatDatepicker<D>;
}
