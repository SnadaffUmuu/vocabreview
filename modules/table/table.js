import { View } from "../view.js";
import {
  speak,
  isOverflow,
  UserActionHandlers,
} from "../utils.js";
import { Application } from "../app.js";

export const TableView = function () {
  this.tableContainer = null;
  this.tableEl = null;
  this.actionsContainer = null;
  this.columnsCount = null;
  this.cells = null;
  this.draggedRow = null;
  
  this.events = {
    'click #addColumn': 'addColumn'
  };

  this.namespaces = {
    'UserActionHandlers': UserActionHandlers
  },

  this.renderedEvents = {
    click: {
      'th .toggle': 'toggleColumn',
      '.cellContentDraggable': 'toggleCell',
      '.speakme': 'speakCell',
      '.expand': 'toggleExpand'
    },
    contextmenu: {
      'tbody': 'UserActionHandlers.preventDefault',
      '.rowDrag': 'UserActionHandlers.preventDefault',
      '.cellContentDraggable': 'UserActionHandlers.preventDefault',
    },
    dragstart: {
      'th:not([draggable="false"])': 'setColumnHeaderDragStart',
      '.cellContentDraggable': 'setItemDragStart',
      '.rowDrag' : 'setRowDragStart',
    },
    dragenter: {
      'td:not(:first-child)': 'toggleDragoverElementHighlight',
    },
    dragleave: {
      'td:not(:first-child)': 'toggleDragoverElementHighlight',
    },
    dragover: {
      'th:not([draggable="false"])': 'UserActionHandlers.preventDefault',
      'th:not([draggable="false"]) .drag': 'UserActionHandlers.preventDefault',
      'th:not([draggable="false"]) .toggle': 'UserActionHandlers.preventDefault',
      'td:not(:first-child)': 'UserActionHandlers.preventDefault',
      '.rowDrag': 'dragRow',
    },
    dragend: {
      'td:not(:first-child)': 'removeDragoverCellHighlights',
      '.cellContentDraggable': 'removeDragoverCellHighlights',
      '.rowDrag': 'setRowDragEnd',
    },
    drop: {
      'th:not([draggable="false"])': 'setColumnHeaderDragDrop',
      'th:not([draggable="false"]) .drag': 'setColumnHeaderDragDrop',
      'th:not([draggable="false"]) .toggle': 'setColumnHeaderDragDrop',
      'td:not(:first-child)': 'dropDragItem',
      '.rowDrag': 'setRowDragDrop'
    },
    touchstart: {
      '.cellContentDraggable': 'setItemTouchStart',
      '.rowDrag': 'setRowTouchStart'
    },
    touchmove: {
      '.cellContentDraggable': 'touchDragItem',
      '.rowDrag': 'touchDragRow'
    },
    touchend: {
      '.cellContentDraggable': 'touchDropItem',
      '.rowDrag': 'touchDropRow'
    },
  };

  this.setTableEvents = function () {
    for (let event in this.renderedEvents) {
      this.tableEl.addEventListener(event, (e) => {
        const entry = this.renderedEvents[event];
        for (let selector in entry) {
          if (e.target.matches && e.target.matches(selector)) {
            if (entry[selector].indexOf('.') < 0) {
              this[entry[selector]].bind(this).call(this, e);
            } else {
              const parts = entry[selector].split('.');
              if (this.namespaces[parts[0]] && this.namespaces[parts[0]][parts[1]]) {
                this.namespaces[parts[0]][parts[1]].bind(this).call(this, e)
              }
            }
          }
        }
      })
    }
  }

  this.addColumn = function () {
    const columnsCount = this.tableEl.querySelectorAll('th').length;
    this.tableEl.querySelector('thead tr').insertAdjacentHTML('beforeend', `
        <th draggable="true" data-index="${columnsCount}">
          <div class="drag">↔️</div>
          <div class="toggle">toggle</div>
        </th>
      `);

    this.tableEl.querySelectorAll('tbody tr').forEach(row => {
      row.insertAdjacentHTML('beforeend', '<td></td>');
      this.setCellEventsAndStuff(row.querySelector('td:last-child'), columnsCount)
    })
  };

  this.swapColumns = function (fromIndex, toIndex) {
    const rows = this.tableEl.rows;
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].cells;

      const fromCell = cells[fromIndex];
      const toCell = cells[toIndex];

      if (fromCell && toCell) {
        if (fromIndex < toIndex) {
          toCell.after(fromCell);
        } else {
          toCell.before(fromCell);
        }
      }
    }
  };

  this.buildTableHtml = function () {
    const resHTML = '<table id="table"><thead><tr><th draggable="false" data-index="0"></th>'
      + (Array.from({ length: this.columnsCount }).map((_, i) =>
        '<th draggable="true" data-index="' + (i + 1) + '"><div class="drag">↔️</div><div class="toggle">toggle</div></th>').join(''))
      + '<th draggable="true" data-index="' + (this.columnsCount + 1) + '"><div class="drag">↔️</div></th>'
      + '</tr></thead><tbody>'
      + this.data.entries.reduce((resHTML, entry) => {
        let entryInfo = `${entry.tag ? 'entryTag: ' + entry.tag : ''}<br>
          entryType: ${entry.entryType}<br>
          linesCount: ${entry.lines.length}<br>
        `;
        entryInfo += entry.lines.map(line => {
          return `
          <br>${line.originalIndex}<br>
          ${line.text}<br>
          speakable: ${line.speakable};${line.isPronounce ? ' isPronounce;' : ''}
          ${line.pronounce ? ' pronounce: ' + line.pronounce + ';' : ''}<br>
          ${line.linetypes.join(', ')}
          `
        }).join('');
        let cells = [];
        for (let i = 0; i < this.columnsCount; i++) {
          cells.push(`
            <td class="draggableContainer">
              ${i < entry.lines.length ?
              '<div draggable="true" '
              + ' class="cellContentDraggable ellipsis'
              + (entry.lines[i]?.speakable ? ' speakable' : '')
              + '">'
              + (entry.lines[i]?.speakable ? '<span data-reading="'
                + entry.lines[i].text
                + '" class="speakme"></span>' : '')
              + (entry.lines[i].text)
              + '<span class="expand" data-expanded="⋈">✥</span>'
              + '</div>'
              : ''}
            </td>
          `)
        };
        return resHTML += '<tr><td><div draggable="true" class="rowDrag">↕️</div></td>'
          + cells.join('')
          + '<td class="entry-info">'
          + '<div class="ellipsis">' 
          + entryInfo 
          + '<span class="expand" data-expanded="⋈">✥</span>'
          + '</div>'
          + '</td>'
          + '</tr>';

      }, '')
      + '</tbody></table>';
    return resHTML;
  };

  this.toggleColumn = function (e) {
    const th = e.target.closest('th');
    if (!th) return;
    const elsToHide = this.columnHideModeEl.checked ?
      this.tableEl.querySelectorAll(`tr td:not(:nth-child(${parseInt(th.dataset.index) + 1}))`)
      : this.tableEl.querySelectorAll(`tr td:nth-child(${parseInt(th.dataset.index) + 1})`);
    elsToHide.forEach(el => el.classList.toggle('hidden'))
  };

  this.toggleCell = function (e) {
    const cell = e.target.closest('td');
    if (cell.classList.contains('hidden') || cell.classList.contains('revealed')) {
      cell.classList.toggle('hidden');
      cell.classList.toggle('revealed');
    }
  };

  this.speakCell = function (e) {
    e.stopPropagation();
    speak(e.target.dataset.reading)
  };

  this.toggleExpand = function (e) {
    let item = e.target.closest('.cellContentDraggable');
    if (!item) {
      item = e.target.closest('div')
    }
    item.classList.toggle('ellipsis');
    const swap = e.target.dataset.expanded;
    const old = e.target.innerHTML;
    e.target.innerHTML = swap;
    e.target.dataset.expanded = old;
  };

  this.setColumnHeaderDragStart = function (e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.index);
  };

  this.setColumnHeaderDragDrop = function (e) {
    e.preventDefault();
    const cell = e.target.tagName == 'TH' ? e.target : e.target.closest('th');
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const targetIndex = Array.from(
      this.tableEl.querySelectorAll('th:not([draggable="false"])')
    ).indexOf(cell) + 1;
    if (fromIndex !== targetIndex) {
      this.swapColumns(fromIndex, targetIndex);
      this.tableEl.querySelectorAll('th').forEach((el, i) => {
        el.dataset.index = i;
      })
    }
  };

  this.setItemDragStart = function (e) {
    if (e.target.closest('td').classList.contains('hidden')) return;
    this.draggedCellContent = e.target;
    e.dataTransfer.effectAllowed = 'move';
  };

  this.toggleDragoverElementHighlight = function (e) {
    e.target.classList.toggle('over');
  };

  this.removeDragoverCellHighlights = function () {
    this.tableEl.querySelectorAll('td.over').forEach(cell => cell.classList.remove('over'));
  };

  this.dropDragItem = function (e) {
    e.preventDefault();
    if (this.draggedCellContent) {
      e.target.appendChild(this.draggedCellContent);
      this.draggedCellContent = null;
    }
  };

  this.setItemTouchStart = function (e) {
    if (e.target.closest('td').classList.contains('hidden')) return;
    this.touchTimeout = setTimeout(() => {
      this.draggable = true;
      e.target.classList.add("dragging");
    }, this.longtouchTimeout);
  };

  this.touchDragItem = function (e) {
    const item = e.target;
    if (!this.draggable) {
      e.stopPropagation();
      clearTimeout(this.touchTimeout)
    } else {
      this.draggedCellContent = item;
      if (!this.placeholder) {
        this.createPlaceholder();
      }
      const touch = e.touches[0];
      item.style.left = `${touch.clientX + 10}px`;
      item.style.top = `${touch.clientY + 10}px`;
      this.potentialContainer = document
        .elementFromPoint(touch.clientX, touch.clientY).closest('td');
      if (this.potentialContainer && this.placeholder) {
        const afterElement = this.getDragAfterElement(
          this.potentialContainer,
          touch.clientY
        );
        if (afterElement) {
          this.potentialContainer.insertBefore(this.placeholder, afterElement);
        } else {
          this.potentialContainer.appendChild(this.placeholder);
        }
      }
      e.preventDefault();
    }
  };

  this.touchDropItem = function (e) {
    clearTimeout(this.touchTimeout);
    this.draggable = false;
    e.target.classList.remove("dragging");
    if (this.draggedCellContent && this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.insertBefore(this.draggedCellContent, this.placeholder);

      this.placeholder.remove();
      this.draggedCellContent.style.left = "";
      this.draggedCellContent.style.top = "";
    }
    this.draggedCellContent = null;
    this.placeholder = null;
  };

  this.setRowTouchStart = function (e) {
    this.touchTimeout = setTimeout(() => {
      this.draggable = true;
      e.target.classList.add("dragging");
    }, this.longtouchTimeout);
  };

  this.touchDragRow = function (e) {
    const el = e.target;
    if (!this.draggable) {
      e.stopPropagation();
      clearTimeout(this.touchTimeout)
    } else {
      this.draggedCellContent = el;
      this.draggedRow = el.closest('tr');
      if (!this.placeholder) {
        this.createPlaceholder();
      }
      const touch = e.touches[0];
      el.style.left = `${touch.clientX + 10}px`;
      el.style.top = `${touch.clientY + 10}px`;
      this.potentialContainer = document
        .elementFromPoint(touch.clientX, touch.clientY).closest('td:has(.rowDrag)');
      if (this.potentialContainer && this.placeholder) {
        this.potentialContainer.appendChild(this.placeholder);
      }
      e.preventDefault();
    }
  };

  this.touchDropRow = function (e) {
    clearTimeout(this.touchTimeout);
    this.draggable = false;
    e.target.classList.remove("dragging");
    if (this.draggedCellContent && this.placeholder && this.placeholder.parentNode) {
      const targetRow = this.placeholder.closest('tr');
      if (targetRow && targetRow !== this.draggedRow) {
        targetRow.before(this.draggedRow);
      }
      this.placeholder.remove();
      this.draggedCellContent.style.left = "";
      this.draggedCellContent.style.top = "";
    }

    this.draggedCellContent = null;
    this.placeholder = null;
  };

  this.setRowDragStart = function (e) {
    this.draggedRow = e.target.closest('tr');
    e.dataTransfer.effectAllowed = 'move';
  };

  this.dragRow = function (e) {
    e.preventDefault();
    const targetRow = e.target.closest('tr');
    if (targetRow && targetRow !== this.draggedRow) {
      const bounding = targetRow.getBoundingClientRect();
      const offset = e.clientY - bounding.top;
      const targetRowHeight = bounding.height;

      if (offset > targetRowHeight / 2) {
        targetRow.after(this.draggedRow);
      } else {
        targetRow.before(this.draggedRow);
      }
    }
  };

  this.setRowDragDrop = function (e) {
    e.preventDefault();
    this.draggedRow = null;
  };

  this.setRowDragEnd = function () {
    this.draggedRow = null;
  };

  this.createPlaceholder = function () {
    if (!this.placeholder) {
      this.placeholder = document.createElement("div");
      this.placeholder.classList.add("placeholder");
      this.placeholder.textContent = "Drop here";
    }
  };

  this.getDragAfterElement = function (container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".cellContentDraggable:not(.dragging)")
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  };

  this.setCellEventsAndStuff = function (cell, i) {
    const item = cell.querySelector('.cellContentDraggable');
    if (item) {
      item.id = `draggable-${i}`;
    };
  };

  this.renderTable = function () {

    this.tableContainer.innerHTML = this.buildTableHtml();
    this.tableEl = this.tableContainer.querySelector('table');

    this.cells = this.tableEl.querySelectorAll('td:not(:first-child)');
    this.draggedCellContent = null;
    this.cells.forEach((cell, i) => {
      this.setCellEventsAndStuff(cell, i)
    });
    this.tbody = this.tableEl.querySelector('tbody');
    this.draggedRow = null;
  };

  this.reset = function () {
    this.data = {};
    this.tableContainer.innerHTML = '';
  };

  this.render = function () {
    this.reset();
    if (!Application.data.currentEntries?.length) {
      return
    }
    this.data.entries = Application.data.currentEntries;
    this.columnsCount = Math.max(...this.data.entries.map(e => e.lines.length))
    this.renderTable();
    this.setTableEvents();
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.tableContainer = this.element.querySelector('#tableContainer');
    this.actionsContainer = this.element.querySelector('#tableActions');
    this.columnHideModeEl = this.element.querySelector('#hideMode')
    this.render();
  }
}

TableView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templatePath: 'modules/table/table.html',
  templateSelector: '#tableView',
  longtouchTimeout: 1500,
  maxCardHeight: 80,
});

TableView.prototype.constructor = TableView;
