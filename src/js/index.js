/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */
import { getFocusNode, isNodeContainsAnother } from './utils';

class Editor {
  constructor({ el }) {
    this.$el = document.querySelector(el);
    this.$area = this.$el.querySelector('.edit-area');

    this.init();
  }

  init() {
    this.bindEvents();
  }

  setComputedStyle(node, className) {
    const styles = window.getComputedStyle(node).cssText.split(';');
    // eslint-disable-next-line no-param-reassign
    node.className = className;
    const computedStyle = window
      .getComputedStyle(node)
      .cssText.split(';')
      .filter((chunk, i) => chunk !== styles[i])
      .join(';');
    // eslint-disable-next-line no-param-reassign
    node.style = [computedStyle, node.style.cssText].join(';');
  }

  bindEvents() {
    this.bindHeaderButtons();
    this.bindInlineButtons();
    this.bindPastEvent();
  }

  bindHeaderButtons() {
    const btns = [
      this.$el.querySelector('.head-1'),
      this.$el.querySelector('.head-2'),
    ];

    btns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        this.setHeader(index + 1);
      });
    });
  }

  setHeader(level) {
    const tag = `H${level}`;
    const tagClass = `header${level}-text`;

    const focusNode = getFocusNode();
    if (!this.$area.contains(focusNode) || focusNode.innerText === '\n') {
      this.$area.focus();
      return;
    }
    try {
      const range = window.getSelection().getRangeAt(0);
      const header = document.createElement(tag);

      range.surroundContents(header);
      this.setComputedStyle(header, tagClass);
    } catch {
      // если selection захватывает разные теги
      const range = window.getSelection().getRangeAt(0);
      const rangeContent = range.cloneContents();

      const headerEl = document.createElement(tag);

      headerEl.append(rangeContent);
      range.deleteContents();
      range.insertNode(headerEl);

      this.setComputedStyle(headerEl, tagClass);
    }
  }

  bindInlineButtons() {
    const map = {
      italic: this.$el.querySelector('.italic'),
      bold: this.$el.querySelector('.bold'),
    };

    Object.entries(map).forEach(([style, node]) => {
      node.addEventListener('click', () => {
        document.execCommand(style);
      });
    });
  }

  bindPastEvent() {
    this.$area.addEventListener('paste', (e) => {
      e.preventDefault();

      const pastedHtml = e.clipboardData.getData('text/html');
      if (pastedHtml) {
        const parser = new DOMParser();

        const parsedContent = parser.parseFromString(pastedHtml, 'text/html');

        [...parsedContent.body.childNodes].forEach((node) => this.reduceMarkup(node));

        const fragment = document.createDocumentFragment();
        const range = window.getSelection().getRangeAt(0);

        range.deleteContents();

        [...parsedContent.body.childNodes].forEach((node) => {
          fragment.appendChild(node);
        });
        range.insertNode(fragment);
        range.collapse();
      } else {
        const textContent = e.clipboardData.getData('text/plain');
        const textEl = document.createTextNode(textContent);
        const range = window.getSelection().getRangeAt(0);
        range.deleteContents();
        range.insertNode(textEl);
        range.collapse();
      }
    });
  }

  reduceMarkup(node) {
    switch (true) {
      case node.nodeName === '#text':
        return;
      case node.nodeName === '#comment':
        return;
      case node.nodeName === 'H1' || node.getAttribute('aria-level') === '1': {
        const headerEl = document.createElement('h1');
        headerEl.innerHTML = node.innerHTML;
        node.replaceWith(headerEl);

        this.setComputedStyle(headerEl, 'header1-text');

        [...headerEl.childNodes].forEach((n) => this.reduceMarkup(n));
        break;
      }
      case node.nodeName === 'H2' || node.getAttribute('aria-level') === '2': {
        const headerEl = document.createElement('h2');
        headerEl.innerHTML = node.innerHTML;
        node.replaceWith(headerEl);

        this.setComputedStyle(headerEl, 'header2-text');

        [...headerEl.childNodes].forEach((n) => this.reduceMarkup(n));
        break;
      }
      case node.nodeName === 'I' || node.style.fontStyle === 'italic': {
        const italicEl = document.createElement('i');
        italicEl.innerHTML = node.innerHTML;
        node.replaceWith(italicEl);

        [...italicEl.childNodes].forEach((n) => this.reduceMarkup(n));
        break;
      }
      case ['B', 'STRONG'].includes(node.nodeName)
        || ['bold', '700'].includes(node.style.fontWeight): {
        const boldEl = document.createElement('b');
        boldEl.innerHTML = node.innerHTML;
        node.replaceWith(boldEl);

        [...boldEl.childNodes].forEach((n) => this.reduceMarkup(n));
        break;
      }
      case ['DIV', 'SPAN', 'P'].includes(node.nodeName): {
        const el = document.createElement(node.nodeName);
        el.innerHTML = node.innerHTML;
        node.replaceWith(el);

        [...node.childNodes].forEach((n) => this.reduceMarkup(n));
        break;
      }
      default:
        node.remove();
    }
  }
}

const editor = new Editor({
  el: '.editor',
});
