import {View} from "../view.js";
import {
  speak,
  UserActionHandlers,
  getDragAfterElement,
  createPlaceholder,
} from "../utils.js";
import {Application} from "../app.js";
import {DataFactory} from "../data.js";
import {Prompt} from "../components/prompt/prompt.js"

export const TableView = function () {
  this.tableContainer = null;
  this.tableEl = null;
  this.actionsContainer = null;
  this.columnsCount = null;
  this.cells = null;
  this.draggedRow = null;

  this.events = {
    //'click #addColumn': 'addColumn',
    'click #reset': 'resetTable',
    'click #zoomin': 'zoomTable',
    'click #zoomout': 'zoomTable',
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
        '.moveToTop': 'moveRowToTop',
        '.moveToBottom': 'moveRowToBottom',
      },
      contextmenu: {
        'tbody': 'UserActionHandlers.preventDefault',
        '.rowDrag': 'UserActionHandlers.preventDefault',
        '.cellContentDraggable': 'UserActionHandlers.preventDefault',
      },
      dragstart: {
        'th:not([draggable="false"])': 'setColumnHeaderDragStart',
        //'.cellContentDraggable': 'setItemDragStart',
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
        // 'td:not(:first-child) .draggableContainerInner': 'dropDragItem',
        // 'td:not(:first-child) .cellContentDraggable': 'dropDragItem',
        '.rowDrag': 'setRowDragDrop'
      },
      touchstart: {
        // '.cellContentDraggable': 'setItemTouchStart',
        '.rowDrag': 'setRowTouchStart'
      },
      touchmove: {
        // '.cellContentDraggable': 'touchDragItem',
        '.rowDrag': 'touchDragRow'
      },
      touchend: {
        // '.cellContentDraggable': 'touchDropItem',
        '.rowDrag': 'touchDropRow'
      },
    };

  // this.addColumn = function () {
  //   const columnsCount = this.tableEl.querySelectorAll('th').length;
  //   this.tableEl.querySelector('thead tr').insertAdjacentHTML('beforeend', `
  //       <th draggable="true" data-index="${columnsCount}">
  //         <div class="drag">↔️</div>
  //         <div class="toggle">toggle</div>
  //       </th>
  //     `);

  //   this.tableEl.querySelectorAll('tbody tr').forEach(row => {
  //     row.insertAdjacentHTML('beforeend', '<td></td>');
  //     this.setCellIndex(row.querySelector('td:last-child'), columnsCount)
  //   })
  // };

  this.zoomTable = function (e) {
    const out = e.target.id == 'zoomout'
    const currentZoom = this.tableEl.dataset.zoomScale ? parseFloat(this.tableEl.dataset.zoomScale) : 1
    const newZoom = out ? currentZoom - 0.1 : currentZoom + 0.1
    this.tableEl.setAttribute('data-zoom-scale', newZoom)
    this.tableEl.style.transform = `scale(${newZoom})`
    this.tableEl.style.transformOrigin = 'top left';
  }

  this.swapColumns = function (fromIndex, toIndex) {
    const rows = this.tableEl.rows;
    for(let i = 0;i < rows.length;i++) {
      const cells = rows[i].cells;

      const fromCell = cells[fromIndex];
      const toCell = cells[toIndex];

      if(fromCell && toCell) {
        if(fromIndex < toIndex) {
          toCell.after(fromCell);
        } else {
          toCell.before(fromCell);
        }
      }
    }
  };

  this.moveRowToTop = function (e) {
    this.tbody.prepend(this.tbody.removeChild(e.target.closest('tr')));
    this.updateStateOrder();
  };

  this.moveRowToBottom = function (e) {
    this.tbody.appendChild(this.tbody.removeChild(e.target.closest('tr')));
    this.updateStateOrder();
  };

  this.resetScale = function () {
    this.tableEl.removeAttribute('data-zoom-scale');
    this.tableEl.style.transform = 'unset'
  };

  this.resetTable = function () {
    new Prompt({
      text: 'Reset table?',
      onConfirm: () => {
        this.data.orderedEntries = null;
        this.state.order && delete this.state.order;
        this.state.colOrder && delete this.state.colOrder;
        this.state.hidden && delete this.state.hidden;
        this.state.revealed && delete this.state.revealed;
        this.render();
        Application.views.StructureView.render();
      }
    });
  };

  this.updateStateOrder = function () {
    this.state.order = [...this.tbody.querySelectorAll('tr')].map(row =>
      parseInt(row.dataset.originalIndex));
    Application.views.StructureView.render();
  };

  this.updateStateColOrder = function () {
    this.state.colOrder = [
      ...this.tableEl.querySelectorAll('th[data-role]')
    ].map(th => th.dataset.role);
  };

  this.toggleColumn = function (e) {
    const th = e.target.closest('th');
    if(!th) return;

    const role = th.dataset.role;
    const hidden = this.state.hidden ? {...this.state.hidden} : {};
    const revealed = this.state.revealed ? {...this.state.revealed} : {};

    const cells = this.columnHideModeEl.checked
      ? [...this.tableEl.querySelectorAll(`tr td[data-role]:not([data-role="${role}"])`)]
      : [...this.tableEl.querySelectorAll(`tr td[data-role="${role}"]`)];

    if(!cells.length) return;

    // Есть ли хотя бы одна открытая ячейка?
    const hasVisibleCell = cells.some(
      cell => !cell.classList.contains('hidden')
    );

    let stateChanged = false;

    cells.forEach(cell => {
      const row = cell.closest('tr');
      if(!row) return;

      const entryId = parseInt(row.dataset.originalIndex);
      const cellRole = cell.dataset.role;

      const list = hidden[entryId] ? hidden[entryId] : [];
      const revealedList = revealed[entryId] ? revealed[entryId] : [];

      if(hasVisibleCell) {
        // === HIDE ALL ===
        if(!cell.classList.contains('hidden')) {
          cell.classList.add('hidden');
          cell.classList.remove('revealed');
        }

        if(!list.includes(cellRole)) {
          hidden[entryId] = [...list, cellRole];
          stateChanged = true;
        }

        if(revealedList.includes(cellRole)) {
          const next = revealedList.filter(r => r !== cellRole);
          if(next.length) {
            revealed[entryId] = next;
          } else {
            delete revealed[entryId];
          }
          stateChanged = true;
        }

      } else {
        // === SHOW ALL ===
        if(cell.classList.contains('hidden')) {
          cell.classList.remove('hidden');
          cell.classList.remove('revealed'); // revealed не должно появляться
        }

        if(!revealedList.includes(cellRole)) {
          revealed[entryId] = [...revealedList, cellRole];
          stateChanged = true;
        }

        if(list.includes(cellRole)) {
          const next = list.filter(r => r !== cellRole);
          if(next.length) {
            hidden[entryId] = next;
          } else {
            delete hidden[entryId];
          }
          stateChanged = true;
        }
      }
    });

    if(stateChanged) {
      this.state.hidden = hidden;
      this.state.revealed = revealed;
      Application.views.StructureView.render();
    }
  };

  this.toggleCell = function (e) {
    const cell = e.target.closest('td');
    if(!cell) return;

    const row = cell.closest('tr');
    const entryId = parseInt(row.dataset.originalIndex);
    //const lineIndex = cell.cellIndex - 1;
    const lineRole = cell.dataset.role;

    const hidden = this.state.hidden ? this.state.hidden : {};
    const list = hidden[entryId] ? hidden[entryId] : [];

    const revealed = this.state.revealed ? this.state.revealed : {};
    const revealedList = revealed[entryId] ? revealed[entryId] : [];

    let stateChanged = false;

    if(cell.classList.contains('hidden')) {
      // hidden → revealed (осознанное открытие)
      cell.classList.remove('hidden');
      cell.classList.add('revealed');

      hidden[entryId] = list.filter(i => i !== lineRole);
      if(!hidden[entryId].length) delete hidden[entryId];

      if(!revealedList.includes(lineRole)) {
        revealed[entryId] = [...revealedList, lineRole];
        stateChanged = true;
      }

    } else {
      // default или revealed → hidden
      cell.classList.add('hidden');
      cell.classList.remove('revealed');

      if(!list.includes(lineRole)) {
        hidden[entryId] = [...list, lineRole];
        stateChanged = true;
      }

      revealed[entryId] = revealedList.filter(i => i !== lineRole);
      if(!revealed[entryId].length) delete revealed[entryId];

    }

    if(stateChanged) {
      this.state.hidden = hidden;
      Application.views.StructureView.render();
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
    if(fromIndex !== targetIndex) {
      this.swapColumns(fromIndex, targetIndex);
      this.updateStateColOrder();
      this.tableEl.querySelectorAll('th').forEach((el, i) => {
        el.dataset.index = i;
      })
    }
  };

  this.setItemDragStart = function (e) {
    if(!this.isDragCellMode()) return;
    if(e.target.closest('td').classList.contains('hidden')) return;
    this.draggedCellContent = e.target;
    e.dataTransfer.effectAllowed = 'move';
  };

  this.toggleDragoverElementHighlight = function (e) {
    if(!this.isDragCellMode()) return;
    this.getDropTargetElement(e.target).classList.toggle('over');
  };

  this.removeDragoverCellHighlights = function () {
    if(!this.isDragCellMode()) return;
    this.tableEl.querySelectorAll('.over').forEach(cell => cell.classList.remove('over'));
  };

  this.dropDragItem = function (e) {
    if(!this.isDragCellMode()) return;
    e.preventDefault();
    if(this.draggedCellContent) {
      this.getDropTargetElement(e.target).appendChild(this.draggedCellContent);
      this.draggedCellContent = null;
    }
  };

  this.setItemTouchStart = function (e) {
    if(!this.isDragCellMode()) return;
    if(e.target.closest('td').classList.contains('hidden')) return;
    this.touchTimeout = setTimeout(() => {
      this.draggable = true;
      e.target.classList.add("dragging");
    }, this.longtouchTimeout);
  };

  this.touchDragItem = function (e) {
    if(!this.isDragCellMode()) return;
    const item = e.target;
    if(!this.draggable) {
      e.stopPropagation();
      clearTimeout(this.touchTimeout)
    } else {
      this.draggedCellContent = item;
      if(!this.placeholder) {
        this.placeholder = createPlaceholder();
      }
      const touch = e.touches[0];
      item.style.left = `${touch.clientX + 10}px`;
      item.style.top = `${touch.clientY + 10}px`;
      const elFromPoint = document
        .elementFromPoint(touch.clientX, touch.clientY);
      this.potentialContainer = elFromPoint.classList.contains('.draggableContainerInner') ?
        elFromPoint : elFromPoint.closest('.draggableContainerInner');
      if(this.potentialContainer && this.placeholder) {
        const afterElement = getDragAfterElement(
          this.potentialContainer,
          touch.clientY,
          touch.clientX
        );
        if(afterElement) {
          this.potentialContainer.insertBefore(this.placeholder, afterElement);
        } else {
          this.potentialContainer.appendChild(this.placeholder);
        }
      }
      e.preventDefault();
    }
  };

  this.touchDropItem = function (e) {
    if(!this.isDragCellMode()) return;
    clearTimeout(this.touchTimeout);
    this.draggable = false;
    e.target.classList.remove("dragging");
    if(this.draggedCellContent && this.placeholder && this.placeholder.parentNode) {
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
    if(!this.draggable) {
      e.stopPropagation();
      clearTimeout(this.touchTimeout)
    } else {
      this.draggedCellContent = el;
      this.draggedRow = el.closest('tr');
      if(!this.placeholder) {
        this.placeholder = createPlaceholder();
      }
      const touch = e.touches[0];
      el.style.left = `${touch.clientX + 10}px`;
      el.style.top = `${touch.clientY + 10}px`;
      this.potentialContainer = document
        .elementFromPoint(touch.clientX, touch.clientY).closest('td:has(.rowDrag)');
      if(this.potentialContainer && this.placeholder) {
        this.potentialContainer.appendChild(this.placeholder);
      }
      e.preventDefault();
    }
  };

  this.touchDropRow = function (e) {
    clearTimeout(this.touchTimeout);
    this.draggable = false;
    e.target.classList.remove("dragging");
    if(this.draggedCellContent && this.placeholder && this.placeholder.parentNode) {
      const targetRow = this.placeholder.closest('tr');
      if(targetRow && targetRow !== this.draggedRow) {
        targetRow.before(this.draggedRow);
      }
      this.placeholder.remove();
      this.draggedCellContent.style.left = "";
      this.draggedCellContent.style.top = "";
    }

    this.draggedCellContent = null;
    this.placeholder = null;
    this.updateStateOrder();
  };

  this.setRowDragStart = function (e) {
    this.draggedRow = e.target.closest('tr');
    e.dataTransfer.effectAllowed = 'move';
  };

  this.dragRow = function (e) {
    e.preventDefault();
    const targetRow = e.target.closest('tr');
    if(targetRow && targetRow !== this.draggedRow) {
      const bounding = targetRow.getBoundingClientRect();
      const offset = e.clientY - bounding.top;
      const targetRowHeight = bounding.height;

      if(offset > targetRowHeight / 2) {
        targetRow.after(this.draggedRow);
      } else {
        targetRow.before(this.draggedRow);
      }
    }
  };

  this.setRowDragDrop = function (e) {
    e.preventDefault();
    this.draggedRow = null;
    this.updateStateOrder();
  };

  this.setRowDragEnd = function () {
    this.draggedRow = null;
    this.updateStateOrder();
  };

  this.setCellIndex = function (cell, i) {
    const item = cell.querySelector('.cellContentDraggable');
    if(item) {
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
        + '>'
        + '<span class="line-text"'
        //+ (line.speakable ? ' data-reading="' + line.text+ '"' : '')
        + '>'
        + (line.speakable ? '<span data-reading="'
          + line.text
          + '" class="speakme"></span>' : '')
        + line.text
        + '</span>'
        + '</div>'
    }, '');
  };

  this.buildTableHtml = function () {
    const model = [];
    const entries = this.data.orderedEntries || this.data.entries;
    entries.forEach(entry => {
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

      if(entry.info) {
        row.push(1000)
      }
      model.push(row);
    });

    this.columnsCount = Math.max(...model.map(r => r.length));

    //remove empty columns
    let emptyColsIndexes = [];

    Array.from({length: this.columnsCount}).forEach((_, i) => {
      if(!model.some(row => row[i] !== null)) {
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
      + (Array.from({length: this.columnsCount}).map((_, i) =>
        '<th draggable="true" data-index="' + (i + 1) + '"'
        + ' data-role="' + (this.remainingColRoles[i] || 'unknown') + '">'
        + '<div class="drag">↔</div><!--<div class="colName">' + this.remainingColRoles[i] + '</div>-->'
        + '<div class="toggle">toggle</div>'
        + '</th>').join(''))
      + '</tr></thead><tbody>'
      + model.reduce((resHTML, row, i) => {
        const entry = entries[i];
        let cells = [];
        row.forEach((cell, ii) => {
          if(cell == 1000) {
            cells.push(`
            <td class="draggableContainer" data-role="info">
            <div class="draggableContainerInner ellipsis">
                <div class="expand"></div>
                <div draggable="true" class="cellContentDraggable">
                  <span class="line-text">ⓘ&nbsp;${entry.info}</span>
                  </div>
              </div>
            </td>
            `)
          } else if(cell == null) {
            cells.push(`
            <td class="draggableContainer" data-role="${this.remainingColRoles[ii]}">
              <div class="draggableContainerInner"></div>
            </td>
            `);
          } else {
            const theLines = entry.lines.filter(l => cell.includes(l.originalIndex));
            cells.push(`
            <td class="draggableContainer" data-role="${this.remainingColRoles[ii]}">
              <div class="draggableContainerInner ellipsis">
                <div class="expand"></div>
                ${this.linesToTableElHtml(theLines, entry)}
              </div>
            </td>
            `)
          }
        });
        return resHTML += '<tr data-original-index="' + entry.originalIndex + '" ' + (entry.tag ? ' data-tag="' + entry.tag + '"' : '') + '><td>'
          + '<div draggable="true" class="rowDrag">↕</div>'
          + '<div class="moveToTop">↑</div><div class="moveToBottom">↓</div>'
          + '</td>'
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

    if(this.tableEl.querySelector('[data-tag]')) {
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

  this.handleFilter = function () {
    this.state.order && delete this.state.order;
    this.state.colOrder && delete this.state.colOrder;
    this.state.hidden && delete this.state.hidden;
    this.state.revealed && delete this.state.revealed;
    Application.views.StructureView.render();
  };

  this.applyColOrderToSchema = function () {
    const saved = this.state.colOrder;

    this.colRoles = [
      ...saved,
      ...this.colRoles.filter(r => !saved.includes(r))
    ];
  };

  this.applyRevealedFromState = function () {
    const revealed = this.state.revealed;
    if(!revealed) return;
    Object.entries(revealed).forEach(([entryId, roles]) => {
      const row = this.tbody.querySelector(`tr[data-original-index="${entryId}"]`);
      if(!row) return;

      roles.forEach(role => {
        const cell = row.querySelector(`[data-role="${role}"]`);
        if(!cell) return;
        cell.classList.add('revealed');
        cell.classList.remove('hidden');
      });
    });
  }

  this.applyHiddenState = function () {
    const hidden = this.state.hidden;
    if(!hidden) return;

    Object.entries(hidden).forEach(([entryId, roles]) => {
      const row = this.tbody.querySelector(`tr[data-original-index="${entryId}"]`);
      if(!row) return;

      roles.forEach(role => {
        const cell = row.querySelector(`[data-role="${role}"]`);
        if(!cell) return;
        cell.classList.add('hidden');
        cell.classList.remove('revealed');
      });
    });
  };

  this.isInProgress = function (state) {
    const theState = state !== undefined ? state : this.state;
    if(theState.revealed && Object.keys(theState.revealed).length > 0
      || Array.isArray(theState.order) && theState.order.length > 0) {
      return true;
    }

    return false;
  };

  this.hasEntriesInProgress = function (indexes) {
    if(this.state.revealed && Object.keys(this.state.revealed).some(k => indexes.includes(parseInt(k)))
      || Array.isArray(this.state.order) && this.state.order.some(idx => indexes.includes(parseInt(idx)))) {
      return true
    }

    return false
  };

  this.reset = function (resetAll) {
    this.data = {};
    this.tableContainer.innerHTML = '';
    if(resetAll == true) {
      this.state.order = [];
      this.state.colOrder = [];
      this.state.hidden = {};
      this.state.revealed = {};
      Application.views.StructureView.render();
    }
  };

  this.render = function (resetAll) {
    this.reset(resetAll);
    if(!Application.getCurrentSourceData()?.currentEntries?.length) {
      if(Application.views.PreloaderView.isShown()) {
        Application.views.PreloaderView.hide();
      }
      return
    }
    this.data.entries = structuredClone(Application.getCurrentSourceData().currentEntries);

    if(this.state.order?.length) {
      this.data.orderedEntries = this.state.order.map(i => this.data.entries.find(entry => entry.originalIndex === i)).filter(o => typeof o !== 'undefined');
    }

    if(this.state.colOrder?.length) {
      this.applyColOrderToSchema();
    }

    this.renderTable();
    this.setRenderedEvents(this.tableEl);
    this.applyHiddenState();
    this.applyRevealedFromState();
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
  shortName: 'table',
  containerSelector: '#appBody',
  templatePath: 'modules/table/table.html',
  templateSelector: '#tableView',
  longtouchTimeout: 200,
  maxCardHeight: 80,
});

TableView.prototype.constructor = TableView;
