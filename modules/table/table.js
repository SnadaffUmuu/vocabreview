import { View } from "../view.js";
import { shuffleArray } from "../utils.js";
import { Application } from "../app.js";

export const TableView = function () {
  this.tableEl = null;
  this.actionsContainer = null;
  this.columnsCount = null;
  this.cells = null;

  this.handleDragStart = function (e) {
    const el = e.target;
    el.style.opacity = '0.4';
    el.style.borderColor = 'blue';

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text', el.id);
  };

  this.handleDragEnd = function (e) {
    const el = e.target;
    el.style.opacity = '1';
    el.style.borderColor = 'transparent';
    this.cells.forEach(function (cell) {
      cell.classList.remove('over');
    });
  };

  this.handleDragOver = function (e) {
    e.preventDefault();
    return false;
  }

  this.handleDragEnter = function (e) {
    e.target.classList.add('over');
  }

  this.handleDragLeave = function (e) {
    e.target.classList.remove('over');
  }

  this.handleDrop = function (e) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text");
    const draggedElement = document.getElementById(data);
    if (draggedElement) {
      e.target.appendChild(draggedElement);
    }
  }

  this.renderTable = function () {
    const resHTML = '<tr>' + (Array.from({ length: this.columnsCount }).map((_, i) => '<th data-index="' + (i+1) + '"><span>toggle</span></th>').join('')) + '</tr>'
      + this.data.entries.reduce((resHTML, entry) => {
        let cells = [];
        for (let i = 0; i < this.columnsCount; i++) {
          cells.push(`<td>${i < entry.lines.length ? '<div draggable="true">' + (entry.lines[i].text) + '</div>' : ''}</td>`)
        }
        return resHTML += '<tr>' + cells.join('') + '</tr>';
      }, '');
    this.tableEl.innerHTML = resHTML;

    this.ths = this.tableEl.querySelectorAll('th');
    this.ths.forEach(th => {
      th.addEventListener('click', (e) => {
        this.tableEl.querySelectorAll(`tr td:nth-child(${th.dataset.index}) div`).forEach(el => el.classList.toggle('hidden'))
      })
    })

    this.cells = this.tableEl.querySelectorAll('td');
    this.cells.forEach((cell, i) => {
      const item = cell.querySelector('div');
      if (item) {
        item.id = `draggable-${i}`;
        item.addEventListener('dragstart', (e) => {
          this.handleDragStart(e);
        });
      }

      cell.addEventListener('click', (e) => {
        const div = e.target.tagName == 'DIV' ? e.target : e.target.querySelector('div');
        div && div.classList.toggle('hidden');
      })
      
      cell.addEventListener('dragend', (e) => {
        this.handleDragEnd(e);
      });
      
      cell.addEventListener('dragenter', (e) => {
        this.handleDragEnter(e);
      });
      
      cell.addEventListener('dragleave', (e) => {
        this.handleDragLeave(e);
      });

      cell.addEventListener('dragover', (e) => {
        this.handleDragOver(e);
      });

      cell.addEventListener('drop', (e) => {
        this.handleDrop(e);
      });
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
    this.render();
  }
}

TableView.prototype = Object.assign(Object.create(View.prototype), {
  containerSelector: '#appBody',
  templatePath: 'modules/table/table.html',
  templateSelector: '#tableView'
});

TableView.prototype.constructor = TableView;