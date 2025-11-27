import {positionDropdown} from "../../utils.js";

export class DropdownMenu {
  constructor({
    items = {},
    dropdownCssClasses = []
  } = {}) {
    this.items = items;
    const html = `
    <div class="dropdown-menu hidden ${dropdownCssClasses.join(' ')}">
      <ul class="dropdown-list">
      ${Object.entries(items).map(([value, label]) => `
        <li class="dropdown-item" data-value="${value}">
          ${label}
        </li>
      `).join('')}
      </ul>
    </div>
  `;

    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    this.el = tpl.content.firstChild;

    this.el.querySelectorAll('.dropdown-item').forEach(li => {
      li.addEventListener('click', () => {
        this.el.dispatchEvent(new CustomEvent('dropdown:select', {
          bubbles: true,
          detail: {value: li.dataset.value}
        }));
        this.close();
      });
    });    
  }

  open() {
    this.el.classList.remove('hidden');
    this.scrollToSelected()
    this.el.dispatchEvent(new CustomEvent('dropdown:open', { bubbles: true }));
  }

  close() {
    this.el.classList.add('hidden');
    this.el.dispatchEvent(new CustomEvent('dropdown:close', { bubbles: true }));
  }

  toggle() {
    if (this.el.classList.contains('hidden')) this.open();
    else this.close();
  }

  appendTo(parent) {
    parent.append(this.el);
    if(this.getSourceElement) {
      positionDropdown(this.el, this.getSourceElement())
    }
    return this
  }

  prependTo(parent) {
    parent.prepend(this.el);
    if(this.getSourceElement) {
      positionDropdown(this.el, this.getSourceElement())
    }
    return this
  }

  highlight(value) {
    const items = this.el.querySelectorAll('li')
    for (const li of items) {
      li.classList.toggle('selected', li.dataset.value === value);
    }
    this.scrollToSelected()
  }

  scrollToSelected() {
    const selected = this.el.querySelector('li.selected')
    selected?.scrollIntoView(true)
  }

}