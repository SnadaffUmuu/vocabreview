import { View } from "../view.js";
import { speak } from "../utils.js";
import { Application } from "../app.js";

export const TableView = function () {
  this.tableEl = null;
  this.actionsContainer = null;
  this.columnsCount = null;
  this.cells = null;
  this.events = {
    'click #addColumn': 'addColumn'
  }

  this.addColumn = function () {
    this.columnsCount++;
    this.tableEl.querySelector('thead tr').insertAdjacentHTML('beforeend', `
        <th draggable="true" data-index="${this.columnsCount}">
          <div class="drag">↔️</div>
          <div class="toggle">toggle</div>
        </th>
      `);

    this.setColumnHeaderEvents(this.tableEl.querySelector('thead th:last-child'));

    this.tableEl.querySelectorAll('tbody tr').forEach(row => {
      row.insertAdjacentHTML('beforeend', '<td></td>');
      this.setCellEventsAndStuff(row.querySelector('td:last-child'), this.columnsCount - 1)
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
    const resHTML = '<thead><tr><th draggable="false" data-index="0"></th>'
      + (Array.from({ length: this.columnsCount }).map((_, i) =>
        '<th draggable="true" data-index="' + (i + 1) + '"><div class="drag">↔️</div><div class="toggle">toggle</div></th>').join(''))
      + '</tr></thead><tbody>'
      + this.data.entries.reduce((resHTML, entry) => {
        let cells = [];
        for (let i = 0; i < this.columnsCount; i++) {
          const readingAttr = entry.lines[i]?.speakable ? 'data-reading="' + entry.lines[i].text + '"' : '';
          cells.push(`
              <td>
                ${i < entry.lines.length ?
              '<div draggable="true" ' + readingAttr + ' class="cellContentDraggable">' + (entry.lines[i].text) + '</div>'
              : ''}
              </td>
            `)
        };
        return resHTML += '<tr><td><div draggable="true" class="rowDrag">↕️</div></td>'
          + cells.join('')
          + '</tr>';

      }, '')
      + '</tbody>';
    return resHTML;
  };

  this.setColumnHeaderEvents = function (th) {
    th.querySelector('.toggle').addEventListener('click', () => {
      const elsToHide = this.columnHideModeEl.checked ?
        this.tableEl.querySelectorAll(`tr td:not(:nth-child(${parseInt(th.dataset.index) + 1}))`)
        : this.tableEl.querySelectorAll(`tr td:nth-child(${parseInt(th.dataset.index) + 1})`)
      elsToHide.forEach(el => el.classList.toggle('hidden'))
    });

    th.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', event.target.dataset.index);
    });

    th.addEventListener('dragover', (event) => {
      // Разрешает перетаскивание
      event.preventDefault();
    });

    th.addEventListener('drop', (event) => {
      event.preventDefault();
      const fromIndex = parseInt(event.dataTransfer.getData('text/plain'));
      const targetIndex = Array.from(
        this.tableEl.querySelectorAll('th:not([draggable="false"])')
      ).indexOf(th) + 1;
      if (fromIndex !== targetIndex) {
        this.swapColumns(fromIndex, targetIndex);
        this.tableEl.querySelectorAll('th').forEach((el, i) => {
          el.dataset.index = i;
        })
      }
    });
  };

  this.setCellEventsAndStuff = function (cell, i) {

    cell.addEventListener('click', (e) => {
      const target = e.target.tagName == 'DIV' ? e.target : e.target.querySelector('.cellContentDraggable');
      if (!(target && target.classList.contains('cellContentDraggable'))) return;
      const cell = e.target.tagName == 'DIV' ? e.target.closest('td') : e.target;
      if (cell.classList.contains('hidden')) {
        cell.classList.toggle('hidden');
        cell.classList.toggle('revealed');
        if (target.dataset.reading) {
          cell.classList.toggle('speakme');
        }
      } else if (cell.classList.contains('revealed') && cell.classList.contains('speakme')) {
        cell.classList.toggle('speakme');
          speak(target.dataset.reading)
      } else if (cell.classList.contains('revealed') && !cell.classList.contains('speakme')) {
        cell.classList.toggle('hidden');
        cell.classList.toggle('revealed');
      } else if (target && target.dataset.reading) {
        speak(target.dataset.reading)
      }
    });

    const item = cell.querySelector('div');
    if (item) {
      item.id = `draggable-${i}`;
      item.addEventListener('dragstart', (e) => {
        if (item.closest('td').classList.contains('hidden')) return;
        this.draggedCellContent = e.target;
        this.draggedCellContent.style.opacity = '0.4';
        this.draggedCellContent.style.border = '1px solid blue';
        e.dataTransfer.effectAllowed = 'move';
        //e.dataTransfer.setData('text', this.draggedCellContent.id);
      });
    };

    cell.addEventListener('dragenter', (e) => {
      e.target.classList.add('over');
    });

    cell.addEventListener('dragleave', (e) => {
      e.target.classList.remove('over');
    });

    cell.addEventListener('dragend', (e) => {
      const el = e.target;
      el.style.opacity = '1';
      el.style.borderColor = 'transparent';

      this.tableEl.querySelectorAll('td').forEach(function (cell) {
        cell.classList.remove('over');
      });
    });

    cell.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    cell.addEventListener('drop', (e) => {
      e.preventDefault();
      if (this.draggedCellContent) {
        cell.appendChild(this.draggedCellContent);
        this.draggedCellContent = null;
      }
    });
  };

  this.renderTable = function () {

    this.tableEl.innerHTML = this.buildTableHtml();

    this.tableEl.querySelectorAll('th:not([draggable="false"])').forEach(th => {
      this.setColumnHeaderEvents(th);
    })

    this.cells = this.tableEl.querySelectorAll('td:not(:first-child)');
    this.draggedCellContent = null;

    this.cells.forEach((cell, i) => {
      this.setCellEventsAndStuff(cell, i)
    });

    this.tbody = this.tableEl.querySelector('tbody');
    this.draggedRow = null;

    this.tbody.addEventListener('dragstart', (event) => {
      this.draggedRow = event.target.closest('tr');
      event.dataTransfer.effectAllowed = 'move';
    });

    this.tbody.addEventListener('dragover', (event) => {
      event.preventDefault(); // Разрешаем сброс
      const targetRow = event.target.closest('tr');
      if (targetRow && targetRow !== this.draggedRow) {
        const bounding = targetRow.getBoundingClientRect();
        const offset = event.clientY - bounding.top;
        const targetRowHeight = bounding.height;

        if (offset > targetRowHeight / 2) {
          targetRow.after(this.draggedRow);
        } else {
          targetRow.before(this.draggedRow);
        }
      }
    });
    this.tbody.addEventListener('drop', (event) => {
      event.preventDefault();
      this.draggedRow = null;
    });

    this.tbody.addEventListener('dragend', () => {
      this.draggedRow = null;
    });
  };

  this.reset = function () {
    this.data = {};
    this.tableEl.innerHTML = '';
  };

  this.render = function () {
    this.reset();
    if (!Application.data.currentEntries?.length) {
      return
    }
    this.data.entries = Application.data.currentEntries;
    this.columnsCount = Math.max(...this.data.entries.map(e => e.lines.length))
    this.renderTable();
  }

  this.show = function () {
    View.prototype.show.call(this);
    this.tableEl = this.element.querySelector('#table');
    this.actionsContainer = this.element.querySelector('#tableActions');
    this.columnHideModeEl = this.element.querySelector('#hideMode')
    this.render();
  }
}

TableView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templatePath: 'modules/table/table.html',
  templateSelector: '#tableView'
});

TableView.prototype.constructor = TableView;