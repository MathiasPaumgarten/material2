/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  Optional,
  ViewEncapsulation,
  HostBinding,
  HostListener,
} from '@angular/core';
import {MatFormFieldControl, MatFormField} from '@angular/material/form-field';
import {NgControl} from '@angular/forms';

import { MatDatepicker } from './datepicker';
import { Subject, merge } from 'rxjs';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {DateAdapter, MAT_DATE_FORMATS, MatDateFormats} from '@angular/material/core';
import {MatDateSelection} from './datepicker-selection';
import {MatBaseDatepickerInput} from './datepicker-input';


let nextUniqueId = 0;

// Largly copied from datepicker-input. There is definitley a better way for this
// I didn't want to set matInput directives as that screws up the rest of the logic.
// the should probably share some functionality.
export abstract class RangeInput<D> {
  _valueChange = new EventEmitter<D | null>();
  _stateChanges = new Subject<void>();

  get focused(): boolean { return this._focused; }
  set focused(value: boolean) {
    if (value !== this._focused) {
      this._focused = value;
      this._stateChanges.next();
    }
  }
  private _focused: boolean = false;

  @HostBinding('class') matRangeInput = 'mat-range-input';
  @HostListener('focus') onFocus() { this.focused = true; }
  @HostListener('blur') onblur() { this.focused = false; }

  @Input()
  get value(): D | null { return this._value; }
  set value(value: D | null) {
    value = this._dateAdapter.deserialize(value);
    this._lastValueValid = !value || this._dateAdapter.isValid(value);
    value = this._getValidDateOrNull(value);
    const oldDate = this.value;
    this._value = value;
    this._formatValue(value);

    if (!this._dateAdapter.sameDate(oldDate, value)) {
      this._valueChange.emit(value);
    }
  }
  private _value: D | null = null;
  private _lastValueValid = false;

  constructor(
    private _elementRef: ElementRef,
    @Optional() public _dateAdapter: DateAdapter<D>,
    @Optional() @Inject(MAT_DATE_FORMATS) private _dateFormats: MatDateFormats) {}

  private _formatValue(value: D | null) {
    this._elementRef.nativeElement.value =
        value ? this._dateAdapter.format(value, this._dateFormats.display.dateInput) : '';
  }

  private _getValidDateOrNull(obj: any): D | null {
    return (this._dateAdapter.isDateInstance(obj) && this._dateAdapter.isValid(obj)) ? obj : null;
  }
}

@Directive({
  selector: 'input[matRangeStart]',
})
export class MatRangeStart<D> extends RangeInput<D> {}

@Directive({
  selector: 'input[matRangeEnd]',
})
export class MatRangeEnd<D> extends RangeInput<D> {}


@Component({
  selector: 'mat-datepicker-range',
  moduleId: module.id,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content></ng-content>`,
  styleUrls: ['datepicker-range-input.css'],
  host: {
    'class': 'mat-datepicker-range'
  },
  providers: [{provide: MatFormFieldControl, useExisting: MatDatepickerRange}],
})
export class MatDatepickerRange<D> extends MatBaseDatepickerInput<D>
                                   implements AfterContentInit, MatFormFieldControl<any> {
  protected _uid = `mat-datepicker-range-${nextUniqueId++}`;

  @ContentChild(MatRangeStart) start: MatRangeStart<D>;
  @ContentChild(MatRangeEnd) end: MatRangeEnd<D>;

  @Input()
  set matDatepicker(value: MatDatepicker<D>) { this._matDatepicker = value; }
  private _matDatepicker: MatDatepicker<D>;

  get value(): MatDateSelection<D> | null { return this._value; }
  set value(range: MatDateSelection<D> | null) {
    if (range) {
      this.start.value = range.start;
      this.end.value = range.end;
    }
    this._value = range;
  }
  private _value: MatDateSelection<D> | null;

  /**
   * Stream that emits whenever the state of the control changes such that the parent `MatFormField`
   * needs to run change detection.
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  readonly stateChanges: Subject<void> = new Subject<void>();

  ngControl: NgControl | null = null;

  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  @Input()
  get id(): string { return this._id; }
  set id(value: string) { this._id = value || this._uid; }
  protected _id: string;

  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  @Input() placeholder = '';

  /** Whether the control is focused. */
  focused: boolean = false;

  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  get empty(): boolean {
    return (this.start && this.end && !this.start.value && !this.end.value);
  }

  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  get shouldLabelFloat(): boolean { return this.focused || !this.empty; }

  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  @Input()
  get required(): boolean { return this._required; }
  set required(value: boolean) { this._required = coerceBooleanProperty(value); }
  protected _required = false;

  /** Whether the control is disabled. */
  readonly disabled: boolean;

  /** Whether the control is in an error state. */
  readonly errorState: boolean;

  /**
   * An optional name for the control type that can be used to distinguish `mat-form-field` elements
   * based on their control type. The form field will add a class,
   * `mat-form-field-type-{{controlType}}` to its root element.
   */
  readonly controlType?: string;

  /**
   * Whether the input is currently in an autofilled state. If property is not present on the
   * control it is assumed to be false.
   */
  readonly autofilled?: boolean;


  constructor(
      private _formField: MatFormField,
      private _elementRef: ElementRef,
  ) {
    super();
    this.selection = new MatDateSelection<D>(null, null);
    this._value = this.selection;
  }

  ngAfterContentInit() {
    if (this._matDatepicker && this.start && this.end) {
      this._matDatepicker._registerInput(this);

      this._matDatepicker._selectedChanged.subscribe((selected: MatDateSelection<D>) => {
        this.start.value = selected.start;
        this.end.value = selected.end;
      });

      merge(this.start._stateChanges, this.end._stateChanges).subscribe(() => {
        const focus: boolean = this.start.focused || this.end.focused;
        if (focus !== this.focused) {
          this.focused = focus;
          this.stateChanges.next();
        }
      });
    }
  }

  /** Returns the palette used by the input's form field, if any. */
  _getThemePalette() {
    return this._formField ? this._formField.color : undefined;
  }

  /** Sets the list of element IDs that currently describe this control. */
  // @ts-ignore
  setDescribedByIds(ids: string[]): void {}


  /**
   * Implemented as part of MatFormFieldControl.
   * @docs-private
   */
  onContainerClick() {
    // this.start.nativeElement.focus();
  }

  /**
   * @deprecated
   * @deletion-target 7.0.0 Use `getConnectedOverlayOrigin` instead
   */
  getPopupConnectionElementRef(): ElementRef {
    return this.getConnectedOverlayOrigin();
  }

  /**
   * Gets the element that the datepicker popup should be connected to.
   * @return The element to connect the popup to.
   */
  getConnectedOverlayOrigin(): ElementRef {
    return this._formField ? this._formField.getConnectedOverlayOrigin() : this._elementRef;
  }
}
