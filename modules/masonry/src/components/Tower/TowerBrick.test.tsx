// Tests for the right click that opens the action menu. The file is .tsx so it runs in the dom
// project: what is covered here is a real press on a rendered brick reaching the store with the
// right id. The menu itself is not drawn yet, so only the store is asserted against.

import { cleanup, fireEvent, render } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { makeEmptyStatement, makeEmptyValue } from '@/mocks/tower';
import { useActionMenuStore } from '@/stores/actionMenu';
import { useBrickLayoutStore } from '@/stores/brick';

import { TowerBrickView } from './TowerBrick';

// -------------------------------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  useActionMenuStore.setState({ brickId: null });
  useBrickLayoutStore.setState({ coords: {}, mounted: {}, positioned: {} });
});

/**
 * Renders bricks by id. `TowerBrickView` renders nothing until the layout store reports the brick
 * as mounted, so the flags are seeded here in place of a layout pass.
 */
function renderBricks(...ids: string[]) {
  act(() => {
    useBrickLayoutStore.getState().setMounted(Object.fromEntries(ids.map((id) => [id, true])));
    useBrickLayoutStore.getState().setPositioned(Object.fromEntries(ids.map((id) => [id, true])));
  });

  render(
    <>
      {ids.map((id) => (
        <TowerBrickView key={id} id={id} node={makeEmptyStatement(id, 0)} />
      ))}
    </>,
  );
}

/** The rendered wrapper for a brick, the element carrying the right click handler. */
function brickEl(id: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-id="${id}"]`);
  if (!el) throw new Error(`no brick rendered for ${id}`);

  return el;
}

// -------------------------------------------------------------------------------------------------

describe('TowerBrickView right click', () => {
  it('opens the action menu on the brick that was pressed', () => {
    renderBricks('brick-1');

    act(() => {
      fireEvent.contextMenu(brickEl('brick-1'));
    });

    expect(useActionMenuStore.getState().brickId).toBe('brick-1');
  });

  it('swallows the browser context menu, so only the action menu shows', () => {
    renderBricks('brick-1');

    // `fireEvent` reports whether the event ran its course, i.e. false once preventDefault ran.
    let ranItsCourse = true;
    act(() => {
      ranItsCourse = fireEvent.contextMenu(brickEl('brick-1'));
    });

    expect(ranItsCourse).toBe(false);
  });

  it('a right click on another brick moves the menu to it', () => {
    renderBricks('brick-1', 'brick-2');

    act(() => {
      fireEvent.contextMenu(brickEl('brick-1'));
    });
    act(() => {
      fireEvent.contextMenu(brickEl('brick-2'));
    });

    expect(useActionMenuStore.getState().brickId).toBe('brick-2');
  });

  it('opens on a value brick as readily as a statement one', () => {
    act(() => {
      useBrickLayoutStore.getState().setMounted({ 'val-1': true });
      useBrickLayoutStore.getState().setPositioned({ 'val-1': true });
    });
    render(<TowerBrickView id="val-1" node={makeEmptyValue('val-1')} />);

    act(() => {
      fireEvent.contextMenu(brickEl('val-1'));
    });

    expect(useActionMenuStore.getState().brickId).toBe('val-1');
  });

  it('leaves the menu closed until a brick is actually pressed', () => {
    renderBricks('brick-1');

    expect(useActionMenuStore.getState().brickId).toBeNull();
  });
});
