import { View } from "../view.js";
import {
  speak,
  UserActionHandlers,
  getDragAfterElement,
  createPlaceholder,
} from "../utils.js";
import { Application } from "../app.js";
import { DataFactory } from "../data.js";

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
      '.draggableContainerInner': 'toggleCell',
      // '.speakme': 'speakCell',
      '[data-reading]': 'speakCell',
      '.expand': 'toggleExpand',
    },
    contextmenu: {
      'tbody': 'UserActionHandlers.preventDefault',
      '.rowDrag': 'UserActionHandlers.preventDefault',
      '.cellContentDraggable': 'UserActionHandlers.preventDefault',
    },
    dragstart: {
      'th:not([draggable="false"])': 'setColumnHeaderDragStart',
      '.cellContentDraggable': 'setItemDragStart',
      '.rowDrag': 'setRowDragStart',
    },
    dragenter: {
      'td:not(:first-child) .draggableContainerInner': 'toggleDragoverElementHighlight',
      'td:not(:first-child) .cellContentDraggable': 'toggleDragoverElementHighlight',
    },
    dragleave: {
      'td:not(:first-child) .draggableContainerInner': 'toggleDragoverElementHighlight',
      'td:not(:first-child) .cellContentDraggable': 'toggleDragoverElementHighlight',
    },
    dragover: {
      'th:not([draggable="false"])': 'UserActionHandlers.preventDefault',
      'th:not([draggable="false"]) .drag': 'UserActionHandlers.preventDefault',
      'th:not([draggable="false"]) .toggle': 'UserActionHandlers.preventDefault',
      'td:not(:first-child) .draggableContainerInner': 'UserActionHandlers.preventDefault',
      'td:not(:first-child) .cellContentDraggable': 'UserActionHandlers.preventDefault',
      '.rowDrag': 'dragRow',
    },
    dragend: {
      'td:not(:first-child) .draggableContainerInner': 'removeDragoverCellHighlights',
      '.cellContentDraggable': 'removeDragoverCellHighlights',
      '.rowDrag': 'setRowDragEnd',
    },
    drop: {
      'th:not([draggable="false"])': 'setColumnHeaderDragDrop',
      'th:not([draggable="false"]) .drag': 'setColumnHeaderDragDrop',
      'th:not([draggable="false"]) .toggle': 'setColumnHeaderDragDrop',
      'td:not(:first-child) .draggableContainerInner': 'dropDragItem',
      'td:not(:first-child) .cellContentDraggable': 'dropDragItem',
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
      this.setCellIndex(row.querySelector('td:last-child'), columnsCount)
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
/*
    let item = e.target.closest('.draggableContainerInner');
    if (!item) {
      item = e.target.closest('div')
    }*/
    [...e.target.closest('tr').querySelectorAll('.draggableContainerInner')].forEach(el =>
      el.classList.toggle('ellipsis')
      )
  };

  this.isDragCellMode = function () {
    return this.dragCells.checked ? true : false;
  };

  this.getDropTargetElement = function (el) {
    return el.classList.contains('draggableContainerInner') ?
    el : el.closest('.draggableContainerInner')
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
    if (!this.isDragCellMode()) return;
    if (e.target.closest('td').classList.contains('hidden')) return;
    this.draggedCellContent = e.target;
    e.dataTransfer.effectAllowed = 'move';
  };

  this.toggleDragoverElementHighlight = function (e) {
    if (!this.isDragCellMode()) return;
    this.getDropTargetElement(e.target).classList.toggle('over');
  };

  this.removeDragoverCellHighlights = function () {
    if (!this.isDragCellMode()) return;
    this.tableEl.querySelectorAll('.over').forEach(cell => cell.classList.remove('over'));
  };

  this.dropDragItem = function (e) {
    if (!this.isDragCellMode()) return;
    e.preventDefault();
    if (this.draggedCellContent) {
      this.getDropTargetElement(e.target).appendChild(this.draggedCellContent);
      this.draggedCellContent = null;
    }
  };

  this.setItemTouchStart = function (e) {
    if (!this.isDragCellMode()) return;
    if (e.target.closest('td').classList.contains('hidden')) return;
    this.touchTimeout = setTimeout(() => {
      this.draggable = true;
      e.target.classList.add("dragging");
    }, this.longtouchTimeout);
  };

  this.touchDragItem = function (e) {
    if (!this.isDragCellMode()) return;
    const item = e.target;
    if (!this.draggable) {
      e.stopPropagation();
      clearTimeout(this.touchTimeout)
    } else {
      this.draggedCellContent = item;
      if (!this.placeholder) {
        this.placeholder = createPlaceholder();
      }
      const touch = e.touches[0];
      item.style.left = `${touch.clientX + 10}px`;
      item.style.top = `${touch.clientY + 10}px`;
      const elFromPoint = document
        .elementFromPoint(touch.clientX, touch.clientY);
      this.potentialContainer = elFromPoint.classList.contains('.draggableContainerInner') ? 
        elFromPoint : elFromPoint.closest('.draggableContainerInner');
      if (this.potentialContainer && this.placeholder) {
        const afterElement = getDragAfterElement(
          this.potentialContainer,
          touch.clientY,
          touch.clientX
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
    if (!this.isDragCellMode()) return;
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
        this.placeholder = createPlaceholder();
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

  this.setCellIndex = function (cell, i) {
    const item = cell.querySelector('.cellContentDraggable');
    if (item) {
      item.id = `draggable-${i}`;
    };
  };

  this.colRoles = [
    'expression',
    'meaning',
    'reading',
    'example',
    'example_translation',
    'alt_reading'
  ]; 

  this.linesToTableElHtml = function (lines, entry) {
    //${line.speakable ? '<div class="speakme" data-reading="' + line.text+ '"></div>' : ''}
    return lines.reduce((res, line, i) => {
      return res += '<div draggable="true" '
      + ' class="cellContentDraggable'
      // + (line.speakable ? ' speakable' : '')
      + '"'
      + (line.role ? ' data-role="' + line.role + '"' : '')
      + (entry.reviewLevel && line.originalIndex == 0 ? ' data-review-level="' + entry.reviewLevel + '"' : '')
       + (line.role && line.role == DataFactory.LINE_ROLE.reading ? ' data-is-reading' : '')
       + '>'
      //  + (line.speakable ? '<span data-reading="'
      //    + line.text
      //    + '" class="speakme"></span>' : '')
        + '<span class="line-text"'
          + (line.speakable ? ' data-reading="' + line.text+ '"' : '')
        + '>' 
          + line.text 
        + '</span>'
        + '</div>'
    }, '');
  };

  this.buildTableHtml = function () {
    const model = [];
    this.data.entries.forEach(entry => {
      const row = [];
      const lines = entry.lines;
      this.colRoles.forEach(role => {
        const linesOfRole = lines.filter(l => l.role == role);
        row.push(linesOfRole.length ? linesOfRole.map(l => l.originalIndex) : null);
      });

      lines.filter(l => 
        !row.find(lArr => lArr?.includes(l.originalIndex))
      ).forEach(l => 
          row.push([l.originalIndex])
      );
      
      if (entry.info) {
        row.push(1000)
      }
      model.push(row);
    });
    
    this.columnsCount = Math.max(...model.map(r => r.length));
    
    //remove empty columns
    let emptyColsIndexes = [];

    Array.from({ length: this.columnsCount }).forEach((_, i) => {
      if (!model.some(row => row[i] !== null)) {
        emptyColsIndexes.push(i);
      }
    });

    this.remainingColRoles = this.colRoles.filter((role, i) => !emptyColsIndexes.includes(i));

    emptyColsIndexes.reverse();

    model.forEach(row => {
      emptyColsIndexes.forEach(index => {
        row.splice(index, 1);
      });
    });

    this.columnsCount = Math.max(...model.map(r => r.length));

    const resHTML = '<table id="table"><thead><tr><th draggable="false" data-index="0"></th>'
      + (Array.from({ length: this.columnsCount }).map((_, i) =>
        '<th draggable="true" data-index="' + (i + 1) + '">'
        + '<div class="drag">↔️</div><!--<div class="colName">' + this.remainingColRoles[i] + '</div>-->' 
        + '<div class="toggle">toggle</div>' 
      + '</th>').join(''))
      + '</tr></thead><tbody>'
      + model.reduce((resHTML, row, i) => {
        const entry = this.data.entries[i];
        let cells = [];
        row.forEach((cell, ii) => {
          if (cell == 1000) {
            cells.push(`
            <td class="draggableContainer">
            <div class="draggableContainerInner ellipsis">
                <div class="expand"></div>
                <div draggable="true" class="cellContentDraggable">
                  <span class="line-text">ⓘ&nbsp;${entry.info}</span>
                  </div>
              </div>
            </td>
            `)
          } else if (cell == null) {
            cells.push(`
            <td class="draggableContainer"><div class="draggableContainerInner"></div></td>
            `);
          } else {
            const theLines = entry.lines.filter(l => cell.includes(l. originalIndex));
            cells.push(`
            <td class="draggableContainer">
              <div class="draggableContainerInner ellipsis">
                <div class="expand"></div>
                ${this.linesToTableElHtml(theLines, entry)}
              </div>
            </td>
            `)
          }
        });
        return resHTML += '<tr' + (entry.tag ? ' data-tag="' + entry.tag + '"' : '') + '><td><div draggable="true" class="rowDrag">↕️</div></td>'
          + cells.join('')
          + (cells.length == this.columnsCount ? '' : 
            Array.from({length: this.columnsCount - cells.length}).map((_, i) => 
              '<td class="draggableContainer"><div class="draggableContainerInner"></td>').join('')
          )
          + '</tr>';

      }, '')
      + '</tbody></table>';
    return resHTML;
  };  

  this.renderTable = function () {

    this.tableContainer.innerHTML = this.buildTableHtml();
    this.tableEl = this.tableContainer.querySelector('table');

    if (this.tableEl.querySelector('[data-tag]')) {
      this.tableEl.insertAdjacentHTML('afterend', DataFactory.buildLegendHtml())
    }

    this.draggedCellContent = null;
    this.cells = this.tableEl.querySelectorAll('td:not(:first-child)');
    this.cells.forEach((cell, i) => {
      this.setCellIndex(cell, i)
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
    if (!Application.getCurrentSourceData()?.currentEntries?.length) {
      if (Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
      return
    }
    this.data.entries = structuredClone(
      Application.getCurrentSourceData().currentEntries);
    this.renderTable();
    this.setRenderedEvents(this.tableEl);
    Application.views.PreloaderView.hidePreloader();
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.tableContainer = this.element.querySelector('#tableContainer');
    this.actionsContainer = this.element.querySelector('#tableActions');
    this.columnHideModeEl = this.element.querySelector('#hideMode');
    this.dragCells = this.element.querySelector('#dragCells');
    this.render();
  }
}

TableView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templatePath: 'modules/table/table.html',
  templateSelector: '#tableView',
  longtouchTimeout: 500,
  maxCardHeight: 80,
});

TableView.prototype.constructor = TableView;
