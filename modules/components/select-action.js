import { DropdownMenu } from './dropdown-menu/dropdown-menu.js';
import { positionDropdown } from '../utils.js';

export class SelectAction {
  constructor({ trigger, items, value, dropdownCssClasses, onChange, appendTo, prependTo }) {
    this.trigger = trigger;
    this.menu = new DropdownMenu({ 
      items,
      dropdownCssClasses 
    });
    this.value = value;

    this.menu.highlight(this.value);
    this.trigger.setLabel(items[this.value]);

    this.trigger.el.addEventListener('trigger:toggle', e => {
      if (e.detail.active) {
        positionDropdown(this.menu.el, this.trigger.el);
        this.open();
      } else {
        this.close();
      }
    });

    this.menu.el.addEventListener('dropdown:select', e => {
      this.setValue(e.detail.value);
      onChange?.(this.value);
      this.trigger.setActive(false);
      this.close();
    });

    this.menu.el.addEventListener('dropdown:close', () => {
      this.trigger.setActive(false);
    });

    if (appendTo)  {
      this.appendTo(appendTo)
    } else if (prependTo) {
      this.prependTo(prependTo)
    }
  }

  reset() {
    this.value = null;
    this.menu.highlight('')
    this.trigger.setLabel('Select a source')
  }

  setValue(value) {
    this.value = value;
    this.menu.highlight(value);
    this.trigger.setLabel(this.menu.items[value]);
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
    document.addEventListener('click', this.outsideClickHandler);
  }

  close() {
    this.menu.close();
    document.removeEventListener('click', this.outsideClickHandler);
  }
}
