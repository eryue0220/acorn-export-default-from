import acorn from 'acorn';

const { TokenType, tokTypes: tt } = acorn;
const assert = 'assert';

tt._assert = new TokenType(assert, { keyword: assert });

export default function exportDefaultFromPlugin(Parser) {

  return class extends Parser {
    supportImportAssertions() {
      return typeof this.parseImportAssertions === 'function';
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

    parseExportAsNamespace(node) {
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
      debugger;

      if (this.eat(tt.start)) {
        this.parseExportAsNamespace(node);
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
        } else if (this.expectContextual('from')) { // export default from '...';
          this.next();
          debugger;
        } else {
          node.declaration = this.parseMaybeAssign();
          this.semicolon();
        }
      } else if (this.shouldParseExportStatement()) {
        if (this.type === tt.name) {
          node.specifiers = [this.parseExportSpecifier(exports)];
          if (this.eat(tt.comma)) {
            if (this.eat(tt.star)) {
              this.parseExportAsNamespace(node);
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
        }

        if (this.supportImportAssertions()) {
          node.attributes = this.parseImportAssertions(node);
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
      }

      return this.finishNode(node, 'ExportNamedDeclaration');
    }
  };
}
