import {positionDropdown} from "../../utils.js";

export class DropdownMenu {
  constructor({items = {}, clickOutsideTarget = document} = {}) {
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

    const outsideClickHandler = (e) => {
      if(!this.el.contains(e.target)) {
        this.close();
      };
    }
    // закрытие при клике вне меню
    (clickOutsideTarget instanceof NodeList ? [...clickOutsideTarget] : [clickOutsideTarget])
      .forEach(el => el.addEventListener('click', outsideClickHandler));

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

}