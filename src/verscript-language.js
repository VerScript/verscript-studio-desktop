// VerScript Language Definition for Monaco Editor in VerScript Studio
export function registerVerScriptLanguage(monaco) {
  if (monaco.languages.getLanguages().some(lang => lang.id === 'verscript')) {
    return;
  }

  monaco.languages.register({ id: 'verscript' });

  // 1. Language Configuration (Comments, brackets, auto-closing)
  monaco.languages.setLanguageConfiguration('verscript', {
    comments: {
      lineComment: '!',
      blockComment: ['!!', '!!'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string', 'comment'] },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    folding: {
      markers: {
        start: new RegExp('^\\s*//\\s*#?region\\b'),
        end: new RegExp('^\\s*//\\s*#?endregion\\b')
      }
    }
  });

  // 2. Syntax Tokenizer (Monarch)
  monaco.languages.setMonarchTokensProvider('verscript', {
    keywords: [
      'display', 'prompt', 'true', 'false', 'loop', 'iterate', 'from', 'to', 'step', 'by',
      'if', 'then', 'else', 'while', 'until', 'do', 'unless', 'internal', 'external', 'error',
      'ForceErrors', 'CriticalErrors', 'SuppressErrors', 'throw', 'inject', 'alias',
      'header', 'include', 'pragma', 'export', 'struct', 'enum', 'config',
      'DataType', 'extends', 'it', 'num', 'bool', 'str', 'arr', 'entity', 'set',
      'def', 'func', 'method', 'inbound', 'outbound', 'outscope', 'reply',
      'class', 'lib', 'library', 'load', 'import', 'static', 'dynamic', 'const',
      'public', 'private', 'temp', 'inst', 'del', 'on', 'when', 'emit',
      'async', 'sync', 'guard', 'chan', 'send', 'recv', 'match', 'with',
      'is', 'even', 'odd', 'isEven', 'isOdd', 'and', 'or', 'not', 'xor', 'shl', 'shr',
      'null', 'inf', 'nan', 'typeof', 'as'
    ],

    mathFunctions: [
      'sqrt', 'rt', 'min', 'max', 'clamp', 'sign', 'sgn', 'divrem',
      'gcd', 'hcf', 'lcm', 'floor', 'ceil', 'round', 'sin', 'cos', 'tan',
      'hypot', 'degToRad', 'radToDeg', 'sinDeg', 'cosDeg', 'ln', 'log', 'log2', 'exp', 'lerp',
      'PI', 'TAU', 'PHI', 'E', 'INF'
    ],

    standardLibraries: [
      'Matrix', 'Vector', 'Math', 'Stats', 'Pseudo', 'Fs', 'Path', 'Env',
      'Time', 'Http', 'Json', 'Crypto', 'Regex', 'Arrays', 'Strings',
      'Log', 'Color', 'Console', 'Benchmark', 'Mock', 'Assert'
    ],

    operators: [
      '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
      '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
      '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
      '%=', '<<=', '>>=', '>>>=', '->', '<-', '?.'
    ],

    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    tokenizer: {
      root: [
        // Identifiers and keywords
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@keywords': 'keyword',
            '@mathFunctions': 'keyword.control',
            '@standardLibraries': 'type.identifier',
            '@default': 'identifier'
          }
        }],

        // Attributes with ?
        [/\?[a-zA-Z_]\w*=*/, 'attribute.name'],

        // Whitespace
        { include: '@whitespace' },

        // Delimiters and operators
        [/[{}()\[\]]/, '@brackets'],
        [/@symbols/, {
          cases: {
            '@operators': 'operator',
            '@default': ''
          }
        }],

        // Numbers
        [/\b0[xX][0-9a-fA-F]+\b/, 'number.hex'],
        [/\b\d+(\.\d+)?([eE][\-+]?\d+)?\b/, 'number'],

        // Strings
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/'/, { token: 'string.quote', bracket: '@open', next: '@stringSingle' }],
      ],

      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
      ],

      stringSingle: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
      ],

      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/!!/, 'comment', '@commentVrs'],
        [/![^!=].*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
        [/#.*$/, 'comment'],
      ],

      commentVrs: [
        [/[^!]+/, 'comment'],
        [/!!/, 'comment', '@pop'],
        [/!/, 'comment']
      ],

      comment: [
        [/[^\/*]+/, 'comment'],
        [/\/\*/, 'comment', '@push'],
        ["\\*/", 'comment', '@pop'],
        [/[\/*]/, 'comment']
      ],
    }
  });

  // 3. Autocomplete / IntelliSense
  monaco.languages.registerCompletionItemProvider('verscript', {
    triggerCharacters: [' ', '.', '?', ':', '('],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const keywords = [
        { label: 'display', insertText: 'display ${1:expression}', isSnippet: true, detail: 'Print value to stdout with optional ?color attribute' },
        { label: 'prompt', insertText: 'prompt ${1:variable} ?default="${2:Explorer}"', isSnippet: true, detail: 'Read interactive input from console stdin' },
        { label: 'true', insertText: 'true', detail: 'Boolean true' },
        { label: 'false', insertText: 'false', detail: 'Boolean false' },
        { label: 'loop', insertText: 'loop ${1:5}\n\t$0', isSnippet: true, detail: 'Repeat block n times' },
        { label: 'iterate', insertText: 'iterate ${1:i} from ${2:1} to ${3:10} step ${4:1}\n\t$0', isSnippet: true, detail: 'Iterate i from start to end with step override' },
        { label: 'from', insertText: 'from ', detail: 'Loop range lower bound' },
        { label: 'to', insertText: 'to ', detail: 'Loop range upper bound' },
        { label: 'step', insertText: 'step ${1:2}', isSnippet: true, detail: 'Loop step increment override' },
        { label: 'by', insertText: 'by ${1:2}', isSnippet: true, detail: 'Step increment alias' },
        { label: 'if', insertText: 'if ${1:condition} then\n\t$0', isSnippet: true, detail: 'If conditional branch' },
        { label: 'then', insertText: 'then', detail: 'Then conditional block prefix' },
        { label: 'else if', insertText: 'else if ${1:condition} then\n\t$0', isSnippet: true, detail: 'Else If conditional branch' },
        { label: 'else', insertText: 'else\n\t$0', isSnippet: true, detail: 'Else fallback branch' },
        { label: 'while', insertText: 'while ${1:condition}\n\t$0', isSnippet: true, detail: 'While loop' },
        { label: 'until', insertText: 'until ${1:condition}\n\t$0', isSnippet: true, detail: 'Until loop (loops while condition is false)' },
        { label: 'do', insertText: 'do\n\t$0\nunless ${1:error}', isSnippet: true, detail: 'Try-Unless exception handling block' },
        { label: 'unless', insertText: 'unless ${1:condition}\n\t$0', isSnippet: true, detail: 'Exception catcher / reactive watch block' },
        { label: 'internal', insertText: 'internal', detail: 'Internal state modifier' },
        { label: 'external', insertText: 'external', detail: 'External trigger modifier' },
        { label: 'error', insertText: 'error', detail: 'Caught error object / message symbol' },
        { label: 'ForceErrors', insertText: 'ForceErrors\n\t$0', isSnippet: true, detail: 'Execute block forcing strict error reporting' },
        { label: 'CriticalErrors', insertText: 'CriticalErrors\n\t$0', isSnippet: true, detail: 'Execute block throwing critical errors only' },
        { label: 'SuppressErrors', insertText: 'SuppressErrors\n\t$0', isSnippet: true, detail: 'Execute block suppressing all runtime errors' },
        { label: 'throw', insertText: 'throw ${1:RuntimeError} ?msg="${2:Error description}"', isSnippet: true, detail: 'Throw error with custom ?msg and ?code attributes' },
        { label: 'inject', insertText: 'inject ${1:python}\n\t$0', isSnippet: true, detail: 'Inject code from 100+ languages (python, js, c, cpp, etc.)' },
        { label: 'alias', insertText: 'alias ${1:display}: ${2:print} ? ${3:color}=${4:tint}', isSnippet: true, detail: 'Define keyword alias with attribute remapping' },
        { label: 'header', insertText: 'header ${1:ServiceName}:\n    func ${2:methodName}(${3:args})', isSnippet: true, detail: 'Declare a typed interface contract header' },
        { label: 'include', insertText: 'include "${1:include/service.h.vrs}"', isSnippet: true, detail: 'Include a header interface contract' },
        { label: 'pragma', insertText: 'pragma ${1|once,strict|}', isSnippet: true, detail: 'Compiler directive' },
        { label: 'export', insertText: 'export ${1:symbol}', isSnippet: true, detail: 'Export symbol from module' },
        { label: 'struct', insertText: 'struct ${1:RecordName}:\n    ${2:id}: ${3:num}\n    ${4:name}: ${5:str}', isSnippet: true, detail: 'Declare a structured typed data record' },
        { label: 'enum', insertText: 'enum ${1:Status}:\n    ${2:PENDING} : 0\n    ${3:ACTIVE} : 1\n    ${4:COMPLETED} : 2', isSnippet: true, detail: 'Declare an enumerated constant mapping' },
        { label: 'config', insertText: 'config ${1|strict_mode,error_mode,timeout_ms,target_version,log_level|}: ${2:value}', isSnippet: true, detail: 'Configure runtime options' },
        { label: 'DataType', insertText: 'DataType ${1:CustomType} extends ${2|num,str,bool,arr|}\n  it ${3:>= 0}', isSnippet: true, detail: 'Declare custom constrained scalar type' },
        { label: 'extends', insertText: 'extends ', detail: 'Inherit from primitive type in DataType declaration' },
        { label: 'it', insertText: 'it', detail: 'Constraint evaluation subject in DataType block' },
        { label: 'num', insertText: 'num ', detail: 'Numeric primitive type' },
        { label: 'bool', insertText: 'bool ', detail: 'Boolean primitive type' },
        { label: 'str', insertText: 'str ', detail: 'String primitive type' },
        { label: 'arr', insertText: 'arr ', detail: 'Array primitive type' },
        { label: 'entity', insertText: 'entity ', detail: 'Object entity primitive type' },
        { label: 'set', insertText: 'set ${1:varName}: ${2:value}', isSnippet: true, detail: 'Assign variable value' },
        { label: 'def', insertText: 'def func ${1:name} ${2:param}\n  reply ${3:result}', isSnippet: true, detail: 'Function definition prefix' },
        { label: 'func', insertText: 'func ${1:name}(${2:params}):\n    reply ${3:result}', isSnippet: true, detail: 'Function declaration' },
        { label: 'method', insertText: 'method ${1:name}(${2:params}):\n    reply ${3:result}', isSnippet: true, detail: 'Method declaration inside class or library' },
        { label: 'inbound', insertText: 'inbound', detail: 'Inbound parameter modifier' },
        { label: 'outbound', insertText: 'outbound', detail: 'Outbound parameter modifier' },
        { label: 'outscope', insertText: 'outscope', detail: 'Outscope closure variable modifier' },
        { label: 'reply', insertText: 'reply ${1:value}', isSnippet: true, detail: 'Return result from function or method' },
        { label: 'class', insertText: 'class ${1:ClassName}:\n    $0', isSnippet: true, detail: 'Define object-oriented class' },
        { label: 'lib', insertText: 'lib ${1:LibName}\n  dynamic:\n    def func ${2:example}\n      reply ${3:42}', isSnippet: true, detail: 'Define modular library block' },
        { label: 'load', insertText: 'load ${1|Matrix,Vector,Math,Stats,Pseudo,Fs,Path,Env,Time,Http,Json,Crypto,Regex,Arrays,Strings,Log,Color,Console,Benchmark,Mock,Assert|}', isSnippet: true, detail: 'Load standard library or native module into memory' },
        { label: 'import', insertText: 'import "${1:library_file}"', isSnippet: true, detail: 'Import external VerScript library' },
        { label: 'static', insertText: 'static:\n    $0', isSnippet: true, detail: 'Static module members section' },
        { label: 'dynamic', insertText: 'dynamic:\n    $0', isSnippet: true, detail: 'Dynamic module members section' },
        { label: 'const', insertText: 'const ${1:NAME}: ${2:value}', isSnippet: true, detail: 'Immutable constant variable' },
        { label: 'public', insertText: 'public ', detail: 'Public member visibility' },
        { label: 'private', insertText: 'private ', detail: 'Private member visibility' },
        { label: 'temp', insertText: 'temp ${1:varName}: ${2:value}', isSnippet: true, detail: 'Scoped temporary variable' },
        { label: 'inst', insertText: 'inst ${1:instance}: ${2:ClassName}()', isSnippet: true, detail: 'Instantiate class' },
        { label: 'del', insertText: 'del ${1:varName}', isSnippet: true, detail: 'Delete variable from current scope' },
        { label: 'on', insertText: 'on ${1:event} do\n    $0', isSnippet: true, detail: 'Register event handler' },
        { label: 'when', insertText: 'when ${1:condition} do\n    $0', isSnippet: true, detail: 'Reactive state trigger' },
        { label: 'emit', insertText: 'emit ${1:eventName} ?data=${2:payload}', isSnippet: true, detail: 'Emit asynchronous event' },
        { label: 'async', insertText: 'async func ${1:name}():\n    $0', isSnippet: true, detail: 'Asynchronous task definition' },
        { label: 'sync', insertText: 'sync ${1:task}', isSnippet: true, detail: 'Synchronize async execution' },
        { label: 'guard', insertText: 'guard ${1:condition} else reply ${2:null}', isSnippet: true, detail: 'Guard condition with early exit' },
        { label: 'chan', insertText: 'set ${1:ch}: chan(${2:5})', isSnippet: true, detail: 'Create concurrency channel with capacity' },
        { label: 'send', insertText: 'send ${1:ch} <- ${2:val}', isSnippet: true, detail: 'Send value into concurrency channel' },
        { label: 'recv', insertText: 'recv ${1:val} <- ${2:ch}', isSnippet: true, detail: 'Receive value from concurrency channel' },
        { label: 'match', insertText: 'match ${1:expr} with\n    ${2:pattern} -> ${3:action}', isSnippet: true, detail: 'Pattern matching construct' },
        { label: 'with', insertText: 'with ', detail: 'Match statement pattern target' },
        { label: 'is', insertText: 'is ', detail: 'Comparison operator keyword' },
        { label: 'even', insertText: 'is even', detail: 'Parity check operator' },
        { label: 'odd', insertText: 'is odd', detail: 'Parity check operator' },
        { label: 'and', insertText: 'and ', detail: 'Logical AND operator' },
        { label: 'or', insertText: 'or ', detail: 'Logical OR operator' },
        { label: 'not', insertText: 'not ', detail: 'Logical NOT operator' },
        { label: 'xor', insertText: 'xor ', detail: 'Bitwise / Logical XOR operator' },
        { label: 'shl', insertText: 'shl ', detail: 'Bitwise shift left' },
        { label: 'shr', insertText: 'shr ', detail: 'Bitwise shift right' }
      ];

      const attributes = [
        { label: '?color=', insertText: '?color="${1|green,cyan,yellow,red,purple,blue,white|}"', isSnippet: true, detail: 'Colorize output with named color' },
        { label: '?color=#', insertText: '?color=#${1:00ffcc}', isSnippet: true, detail: 'Colorize output with 24-bit Truecolor hex' },
        { label: '?tint=', insertText: '?tint="${1|green,cyan,yellow,red,purple,blue|}"', isSnippet: true, detail: 'Tint alias for color' },
        { label: '?newline=false', insertText: '?newline=false', detail: 'Print inline segment without trailing newline' },
        { label: '?default=', insertText: '?default="${1:Explorer}"', isSnippet: true, detail: 'Default fallback value for prompt stdin' },
        { label: '?msg=', insertText: '?msg="${1:Custom error message}"', isSnippet: true, detail: 'Custom error message attached to throw' },
        { label: '?code=', insertText: '?code=${1:500}', isSnippet: true, detail: 'Numerical error code' },
        { label: '?retry=', insertText: '?retry=${1:3}', isSnippet: true, detail: 'Retry count for operation' },
        { label: '?catch=', insertText: '?catch=${1:RuntimeError}', isSnippet: true, detail: 'Inline error handler' },
        { label: '?timeout=', insertText: '?timeout=${1:1000}', isSnippet: true, detail: 'Execution timeout in milliseconds' }
      ];

      const errors = [
        'MemoryAllocationError', 'UndefinedVariableError', 'InvalidOperandError', 'DivisionByZeroError',
        'IndentationError', 'LoopIterationError', 'LoopLimitError', 'LoopDirectionError',
        'LoopStepError', 'ScopeViolationError', 'SyntaxError', 'RuntimeError',
        'InvalidErrorNameError', 'SystemError', 'VisibilityError', 'ImmutableError',
        'IndexOutOfBoundsError', 'EntityError', 'FileError', 'DomainError',
        'AssertError', 'DataTypeError', 'UnassignedVariableError', 'AsyncError',
        'ChannelError', 'MatchError', 'OperationError', 'HeaderMismatchError', 'InvalidHeaderError'
      ].map(err => ({
        label: err,
        insertText: err,
        kind: monaco.languages.CompletionItemKind.Class,
        detail: 'Standard VerScript Error Type',
        range
      }));

      const stdlibs = [
        { label: 'Matrix.create', insertText: 'Matrix.create(${1:rows}, ${2:cols})', isSnippet: true, detail: 'Create zero matrix (r x c)' },
        { label: 'Matrix.identity', insertText: 'Matrix.identity(${1:size})', isSnippet: true, detail: 'Create n x n identity matrix' },
        { label: 'Matrix.add', insertText: 'Matrix.add(${1:m1}, ${2:m2})', isSnippet: true, detail: 'Matrix addition' },
        { label: 'Matrix.mul', insertText: 'Matrix.mul(${1:m1}, ${2:m2})', isSnippet: true, detail: 'Matrix multiplication' },
        { label: 'Matrix.transpose', insertText: 'Matrix.transpose(${1:m})', isSnippet: true, detail: 'Transpose matrix rows and columns' },
        { label: 'Matrix.det', insertText: 'Matrix.det(${1:m})', isSnippet: true, detail: 'Compute determinant of square matrix' },
        { label: 'Vector.create', insertText: 'Vector.create(${1:components})', isSnippet: true, detail: 'Create n-dimensional vector' },
        { label: 'Vector.dot', insertText: 'Vector.dot(${1:v1}, ${2:v2})', isSnippet: true, detail: 'Vector dot product' },
        { label: 'Vector.cross', insertText: 'Vector.cross(${1:v1}, ${2:v2})', isSnippet: true, detail: '3D vector cross product' },
        { label: 'Vector.mag', insertText: 'Vector.mag(${1:v})', isSnippet: true, detail: 'Vector magnitude / Euclidean length' },
        { label: 'Math.abs', insertText: 'Math.abs(${1:x})', isSnippet: true, detail: 'Absolute value' },
        { label: 'Math.sqrt', insertText: 'Math.sqrt(${1:x})', isSnippet: true, detail: 'Square root' },
        { label: 'Math.pow', insertText: 'Math.pow(${1:base}, ${2:exp})', isSnippet: true, detail: 'Exponentiation' },
        { label: 'Math.clamp', insertText: 'Math.clamp(${1:val}, ${2:min}, ${3:max})', isSnippet: true, detail: 'Clamp value between min and max' },
        { label: 'Stats.mean', insertText: 'Stats.mean(${1:arr})', isSnippet: true, detail: 'Arithmetic mean of array' },
        { label: 'Fs.read', insertText: 'Fs.read(${1:filename})', isSnippet: true, detail: 'Read file contents' },
        { label: 'Fs.write', insertText: 'Fs.write(${1:filename}, ${2:content})', isSnippet: true, detail: 'Write data to file' },
        { label: 'Json.parse', insertText: 'Json.parse(${1:jsonStr})', isSnippet: true, detail: 'Parse JSON into object' },
        { label: 'Json.stringify', insertText: 'Json.stringify(${1:val})', isSnippet: true, detail: 'Stringify value to JSON' }
      ].map(item => ({
        ...item,
        kind: monaco.languages.CompletionItemKind.Method,
        insertTextRules: item.isSnippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
        range
      }));

      const suggestions = [
        ...keywords.map(kw => ({
          label: kw.label,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: kw.insertText,
          insertTextRules: kw.isSnippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
          detail: kw.detail,
          range
        })),
        ...attributes.map(attr => ({
          label: attr.label,
          kind: monaco.languages.CompletionItemKind.Property,
          insertText: attr.insertText,
          insertTextRules: attr.isSnippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
          detail: attr.detail,
          range
        })),
        ...errors,
        ...stdlibs
      ];

      return { suggestions };
    }
  });

  // 4. Hover Provider (Docs tooltip)
  monaco.languages.registerHoverProvider('verscript', {
    provideHover: (model, position) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const docs = {
        'display': '**display** statement: Prints expressions to standard output.\n\nAttributes: `?color="name"`, `?tint="name"`, `?newline=false`',
        'prompt': '**prompt** statement: Reads interactive input from standard input.\n\nAttributes: `?default="Explorer"`',
        'loop': '**loop <n>** statement: Repeats block n times.',
        'iterate': '**iterate <i> from <a> to <b> [step <s>]**: Iterates variable over specified range.',
        'header': '**header <Name>**: Declares an interface contract with typed methods and structs.',
        'include': '**include "<file>"**: Loads a header contract specification file.',
        'pragma': '**pragma <directive>**: Controls compiler modes like `pragma once` and `pragma strict`.',
        'DataType': '**DataType <Name> extends <Type>**: Creates a custom scalar constrained type.',
        'Matrix': '**Matrix** library: High-performance linear algebra with determinants, inverses, eigenvalues.',
        'Vector': '**Vector** library: Geometric 2D/3D vectors with dot and cross products.',
        'inject': '**inject <lang>**: Embeds code from 100+ languages directly inside VerScript.',
        'throw': '**throw <Error> ?msg="..."**: Raises an exception with custom attributes.',
        'unless': '**unless <condition>**: Catches exceptions or triggers reactive state handlers.'
      };

      if (docs[word.word]) {
        return {
          range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
          contents: [{ value: docs[word.word] }]
        };
      }
      return null;
    }
  });
}
