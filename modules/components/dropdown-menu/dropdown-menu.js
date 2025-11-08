import { positionDropdown } from "../../utils.js";

export class DropdownMenu {
  constructor({items = {}, onSelect, clickOutsideTarget = document, getSourceElement = null} = {}) {
    this.getSourceElement = getSourceElement
    const html = `
    <div class="dropdown-menu hidden">
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

    const clickHandler = (e) => {
      if(!this.el.contains(e.target)) {
        this.close()
      };
    }
    // закрытие при клике вне меню
    if (clickOutsideTarget instanceof NodeList) {
      clickOutsideTarget.forEach(el => el.addEventListener('click', clickHandler))
    } else {
      clickOutsideTarget.addEventListener('click', clickHandler);
    }

    this.el.querySelectorAll('.dropdown-item').forEach(li => {
      li.addEventListener('click', () => {
        if(onSelect) onSelect(li.dataset.value);
        this.close();
      });
    });

  }

  open() {this.el.classList.remove('hidden')}
  close() {this.el.classList.add('hidden')}
  toggle() {
    this.el.classList.toggle('hidden')
  }
  appendTo(parent) {
    parent.append(this.el);
    if (this.getSourceElement) {
      positionDropdown(this.el, this.getSourceElement())
    }
    return this
  }

}