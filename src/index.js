import acorn from 'acorn';
import { isWhitespace } from './util';

const { TokenType, tokTypes: tt } = acorn;
const assert = 'assert';
const FUNC_STATEMENT = 1;
const FUNC_NULLABLE_ID = 4;

tt._assert = new TokenType(assert, { keyword: assert });

export default function exportDefaultFromPlugin(Parser) {

  return class extends Parser {
    supportImportAssertions() {
      return typeof this.parseImportAssertions === 'function';
    }

    lookahead(word) {
      let out = '';
      let i = 0;

      for (;;i++) {
        if (isWhitespace(this.input.charCodeAt(this.pos + i))) {
          continue;
        }
        break;
      }

      for (;;i++) {
        const code = this.input.charCodeAt(this.pos + i);
        if (isWhitespace(code)) {
          break;
        }
        out += this.input[this.pos + i];
      }

      return out === word;
    }

    shouldParseExportStatement() {
      const res = this.type === tt.name;
      return (res || super.shouldParseExportStatement());
    }

    parseExportSpecifier(exports) {
      const node = this.startNode();
      node.exported = this.parseLiteral(this.value);
      this.finishNode(node, 'ExportDefaultSpecifier');
      this.checkExport(exports, node.exported, this.lastTokStart);
      return node;
    }

    parseExportAsNamespace(node, exports) {
      if (this.options.ecmaVersion >= 11) {
        if (this.eatContextual('as')) {
          node.exported = this.parseModuleExportName();
          this.checkExport(exports, node.exported, this.lastTokStart);
        } else {
          node.exported = null;
        }
      }
    }

    parseExport(node, exports) {
      this.next();

      if (this.eat(tt.star)) {
        this.parseExportAsNamespace(node, exports);
        this.expectContextual('from');
        if (this.type !== tt.string) this.unexpected();
        node.source = this.parseExprAtom();
        this.semicolon();
        return this.finishNode(node, 'ExportAllDeclaration');
      } else if (this.eat(tt._default)) {
        this.checkExport(exports, 'default', this.lastTokStart);
        let isAsync;

        if (this.type === tt._function || (isAsync = this.isAsyncFunction())) {
          let fNode = this.startNode();
          this.next();
          if (isAsync) this.next();

          node.declaration = this.parseFunction(
            fNode,
            FUNC_STATEMENT | FUNC_NULLABLE_ID,
            false,
            isAsync,
          );
        } else if (this.type === tt._class) {
          let cNode = this.startNode();
          node.declaration = this.parseClass(cNode, 'nullableID');
        } else if (this.eatContextual('from')) { // export default from '...';
          this.next();
          node.source = this.parseExprAtom();
        } else {
          node.declaration = this.parseMaybeAssign();
          this.semicolon();
        }
      } else if (this.shouldParseExportStatement()) {
        if (this.type === tt.name && this.lookahead('from')) {
          node.specifiers = [this.parseExportSpecifier(exports)];
          if (this.eat(tt.comma)) {
            if (this.eat(tt.star)) {
              this.parseExportAsNamespace(node, exports);
            }
          }
          this.expectContextual('from');
          if (this.type !== tt.string) this.unexpected();
          node.source = this.parseExprAtom();
        } else {
          node.declaration = this.parseStatement(null);
          if (node.declaration.type === 'VariableDeclaration') {
            this.checkVariableExport(exports, node.declaration.declarations);
          } else {
            this.checkExport(exports, node.declaration.id, node.declaration.id.start);
          }
          node.specifiers = [];
          node.source = null;

          if (this.supportImportAssertions()) {
            node.attributes = this.parseImportAssertions(node);
          }
        }

        this.semicolon();
      } else {
        node.declaration = null;
        node.specifiers = this.parseExportSpecifiers(exports);

        if (this.eatContextual('from')) {
          if (this.type !== tt.string) this.unexpected();
          node.source = this.parseExprAtom();
        } else {
          for (let spec of node.specifiers) {
            // check for keywords used as local names
            this.checkUnreserved(spec.local);
            // check if export is defined
            this.checkLocalExport(spec.local);
            if (spec.local.type === 'Literal') {
              this.raise(
                spec.local.start,
                'A string literal cannot be used as an exported binding without `from`.',
              );
            }
          }
          node.source = null;
        }

        this.semicolon();
      }

      return this.finishNode(node, 'ExportNamedDeclaration');
    }
  };
}
