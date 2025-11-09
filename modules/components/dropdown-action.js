import { DropdownMenu } from './dropdown-menu/dropdown-menu.js';
import { positionDropdown } from '../utils.js';

export class DropdownAction {
  constructor({
    trigger,                // элемент-триггер (любой)
    items = {},
    onSelect,
    clickOutsideTarget = document,
    appendTo
  } = {}) {

    if (!trigger || !trigger.el) {
      throw new Error('DropdownAction requires a trigger component with .el');
    }

    this.trigger = trigger;
    this.menu = new DropdownMenu({ items, clickOutsideTarget });

    // слушаем события триггера
    this.trigger.el.addEventListener('trigger:toggle', e => {
      const active = e.detail.active;
      if (active) {
        positionDropdown(this.menu.el, this.trigger.el);
        this.menu.open();
      } else {
        this.menu.close();
      }
    });

    // обработка выбора в меню
    this.menu.el.addEventListener('dropdown:select', e => {
      if (onSelect) onSelect(e.detail.value);
      this.trigger.setActive(false);
      this.menu.close();
    });

    this.menu.el.addEventListener('dropdown:close', () => {
      this.trigger.setActive(false);
    });

    if (appendTo) this.appendTo(appendTo);
  }

  appendTo(parent) {
    parent.append(this.trigger.el);
    parent.append(this.menu.el);
    return this;
  }
}
