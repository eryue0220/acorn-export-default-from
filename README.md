# acorn-export-from-default
Support export-default-from in Acorn

## Usage
Require this module as an Acorn plugin just like the following code:

```js
import { Parser } from 'acorn';
import ExportDefaultFromPlugin from 'acorn-export-default-from';

const MyParser = Parser.extend(ExportDefaultFromPlugin);

MyParser.parse(/* code */, { /* configuration*/ });
```

## License
This repo is release under an MIT License
