import { DropdownMenu } from './dropdown-menu/dropdown-menu.js';
import { positionDropdown } from '../utils.js';

export class DropdownAction {
  constructor({
    trigger,                // элемент-триггер (любой)
    items = {},
    onSelect,
    appendTo
  } = {}) {

    if (!trigger || !trigger.el) {
      throw new Error('DropdownAction requires a trigger component with .el');
    }

    this.trigger = trigger;
    this.menu = new DropdownMenu({ items });

    // слушаем события триггера
    this.trigger.el.addEventListener('trigger:toggle', e => {
      const active = e.detail.active;
      if (active) {
        positionDropdown(this.menu.el, this.trigger.el);
        this.open();
      } else {
        this.close();
      }
    });

    // обработка выбора в меню
    this.menu.el.addEventListener('dropdown:select', e => {
      if (onSelect) onSelect(e.detail.value);
      this.trigger.setActive(false);
      this.close();
    });

    this.menu.el.addEventListener('dropdown:close', () => {
      this.trigger.setActive(false);
    });

    this.outsideClickHandler = this.outsideClickHandler.bind(this);

    if (appendTo) this.appendTo(appendTo);
  }

  appendTo(parent) {
    parent.append(this.trigger.el);
    parent.append(this.menu.el);
    return this;
  }

  prependTo(parent) {
    parent.prepend(this.trigger.el);
    parent.prepend(this.menu.el);
    return this;
  }

  open() {
    this.menu.open();
    // начинаем слушать документ — именно здесь мы знаем про trigger и menu
    document.addEventListener('click', this.outsideClickHandler);
  }

  close() {
    this.menu.close();
    document.removeEventListener('click', this.outsideClickHandler);
  }  

  outsideClickHandler(e) {
    const clickedInsideMenu = this.menu.el.contains(e.target);
    const clickedTrigger = this.trigger.el.contains(e.target);
    if (!clickedInsideMenu && !clickedTrigger) {
      this.trigger.setActive(false); // синхронизируем состояние
      this.close();
    }
  }  
}
