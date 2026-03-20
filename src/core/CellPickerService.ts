/**
 * CellPickerService — singleton bus between the rules editor and XGraph.
 *
 * When the user clicks the "pick cell" button in the mapping editor:
 *   1. The editor calls CellPickerService.startPick(callback)
 *   2. XGraph's mouseDown handler sees isActive() === true and calls notifyPick(cellId)
 *   3. The callback receives the cellId and writes it to the pattern field
 *   4. Pick mode is automatically cancelled after one pick or on cancel()
 *
 * Listeners registered via onActiveChange() receive the active state so the
 * panel can display a "click a cell" overlay and apply a crosshair cursor.
 */

type PickCallback = (cellId: string) => void;
type ActiveChangeListener = (active: boolean) => void;

class CellPickerServiceClass {
  private _callback: PickCallback | null = null;
  private _activeChangeListeners: Set<ActiveChangeListener> = new Set();

  /** Enter pick mode. The callback will be called once with the chosen cell ID. */
  startPick(callback: PickCallback): void {
    this._callback = callback;
    this._notifyActiveChange(true);
  }

  /** Cancel pick mode without invoking the callback. */
  cancel(): void {
    if (this._callback) {
      this._callback = null;
      this._notifyActiveChange(false);
    }
  }

  /** Returns true when a pick is in progress. */
  isActive(): boolean {
    return this._callback !== null;
  }

  /**
   * Called by XGraph when the user clicks a cell while pick mode is active.
   * Invokes the registered callback and exits pick mode.
   */
  notifyPick(cellId: string): void {
    if (this._callback) {
      const cb = this._callback;
      this._callback = null;
      this._notifyActiveChange(false);
      cb(cellId);
    }
  }

  /** Subscribe to active-state changes (true = pick mode entered, false = exited). */
  onActiveChange(listener: ActiveChangeListener): () => void {
    this._activeChangeListeners.add(listener);
    return () => this._activeChangeListeners.delete(listener);
  }

  private _notifyActiveChange(active: boolean): void {
    this._activeChangeListeners.forEach((l) => l(active));
  }
}

export const CellPickerService = new CellPickerServiceClass();
