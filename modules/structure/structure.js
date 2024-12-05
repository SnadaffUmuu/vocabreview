
import { View } from "../view.js";
import { Application } from "../app.js"
import { DataFactory } from "../data.js"

export const StructureView = function () {
  this.toggleEl = null;
  this.treeEl = null;
  this.resetTreeEl = null;
  this.events = {
    'click #structureTrigger': 'toggleTree',
    'click #resetTree': 'resetTreeFilters',
    'click #filterCollection': 'filterCollection',
  };

  this.toggleTreeCheckboxes = function (e) {
    let check = e.target;

    //  check/unchek children (includes check itself)
    const children = Array.from(check.parentNode.querySelectorAll('input'))
    children.forEach(child => child.checked = check.checked);

    //  traverse up from target check
    while (check) {
      //  find parent and sibling checkboxes (quick'n'dirty)
      const parent = (check.closest(['ul']).parentNode).querySelector('input');
      const siblings = Array.from(parent.closest('li').querySelector(['ul']).querySelectorAll('input'));

      //  get checked state of siblings
      //  are every or some siblings checked (using Boolean as test function) 
      const checkStatus = siblings.map(check => check.checked);
      const every = checkStatus.every(Boolean);
      const some = checkStatus.some(Boolean);

      //  check parent if all siblings are checked
      //  set indeterminate if not all and not none are checked
      parent.checked = every;
      parent.indeterminate = !every && every !== some;

      //  prepare for nex loop
      check = check != parent ? parent : 0;
    }
  }

  this.resetTreeFilters = function () {
    Array.from(
      this.treeEl.querySelectorAll('input[type=checkbox]:checked')
    ).forEach(ch => ch.checked = false)
    DataFactory.filter(null)
  }

  this.filterCollection = function () {
    const checkedSections = Array.from(
      this.treeEl.querySelectorAll('input[type=checkbox]:checked')
    ).map(ch => parseInt(ch.value))
    DataFactory.filter(checkedSections)
  }

  this.toggleTree = function () {
    this.treeEl.style.display = this.treeEl.style.display == 'none' ? '' : 'none'
  }

  this.getCheckboxHtml = function (value) {
    return `<input type="checkbox" value="${value}">`
  }

  this.render = function () {
    this.treeEl.querySelector('ul').innerHTML = '';
    const resItems = Application.data.collection.structure.reduce((resItems, entry) => {
      const children = entry.children ? entry.children.map(ch => `<li data-tree-id="${ch.id}">${this.getCheckboxHtml(ch.id)}&nbsp;${ch.name}</li>`) : [];
      resItems.push(`<li data-tree-id="${entry.id}">
        ${this.getCheckboxHtml(entry.id)}&nbsp;
        ${entry.name}${children.length ? '<ul>' + children.join('') + '</ul>' : ''}
      </li>`)
      return resItems;
    }, []);
    this.treeEl.querySelector('ul').insertAdjacentHTML('afterbegin',
      resItems.join('')
    )
    Array.from(this.element.querySelectorAll('input[type=checkbox]')).forEach(el => {
      el.addEventListener('change', (e) => {
        this.toggleTreeCheckboxes(e)
      })
    })
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.toggleEl = document.getElementById('structureTrigger');
    this.treeEl = document.getElementById('structureTree');
    this.resetTreeEl = document.getElementById('resetTree');
    this.render();
  }
};
StructureView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#menu',
  templatePath: 'modules/structure/structure.html',
  templateSelector: '#structure'
})
StructureView.prototype.constructor = StructureView;