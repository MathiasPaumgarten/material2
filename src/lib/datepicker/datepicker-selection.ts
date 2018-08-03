/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { DateAdapter } from '@angular/material/core';

export enum MatDateSelectionState {
  EMPTY,
  OPEN,
  COMPLETE,
}

export class MatDateSelection<D> {
  start: D | null;
  end: D | null;

  get date(): D | null { return this.start; }
  set date( value: D | null ) { this.start = value; }

  private _isDate: boolean;
  get isDate(): boolean {
    return this._isDate;
  }

  get isRange(): boolean {
    return !this._isDate;
  }

  get isComplete(): boolean {
    return this.state === MatDateSelectionState.COMPLETE;
  }

  state: MatDateSelectionState;

  constructor(date: D | null, end?: D | null) {
    this._isDate = end === undefined;
    this.start = date;
    this.end = end || null;

    this.state = this.isRange ? MatDateSelectionState.EMPTY : MatDateSelectionState.COMPLETE;

    if (this.isRange && this.start) {
      this.state = MatDateSelectionState.OPEN;
    }

    if (this.isRange && (this.end === undefined || this.end !== null)) {
      this.state = MatDateSelectionState.COMPLETE;
    }
  }

  clone(adapter: DateAdapter<D>): MatDateSelection<D> {
    const start = this.start ? adapter.clone(this.start) : null;
    const end = this.end ? adapter.clone(this.end) : null;

    if (this.isRange) {
      return new MatDateSelection(start, end);
    } else {
      return new MatDateSelection(start);
    }
  }

  setNext(date: D) {
    if (this.isDate) {
      this.start = date;
    } else {
      switch (this.state) {
        case MatDateSelectionState.EMPTY:
        case MatDateSelectionState.COMPLETE:
          this.start = date;
          this.state = MatDateSelectionState.OPEN;
          break;
        case MatDateSelectionState.OPEN:
          this.end = date;
          this.state = MatDateSelectionState.COMPLETE;
          break;
      }
    }
  }

  static isSame<D>(
      adapter: DateAdapter<D>,
      a: MatDateSelection<D> | null,
      b: MatDateSelection<D> | null
  ): boolean {
    if (!a || !b) {
      return false;
    } else {
      return a.isDate === b.isDate &&
          adapter.sameDate(a.start, b.start) &&
          adapter.sameDate(a.end, b.end);
    }
  }

  static isValidDateOrNull<D>(
      adapter: DateAdapter<D>,
      value: MatDateSelection<D> | null
  ): MatDateSelection<D> | null {
    if (!value) {
      return null;
    }
    return (adapter.isDateInstance(value.date) && adapter.isValid(value.date!)) ? value : null;
  }
}
