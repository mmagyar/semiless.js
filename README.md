# semiless.js
Forget about the semicolons safely.

I really dislike semicolons, they add a lot of visual noise, with no real benefits, but it's a shame that javascript kind of botched up statement termination.
But worry not, this tool is here to help with those deficiencies

If you type something like this:
```
var myNumber = 32
(function(text){ console.log(text) })(myNumber)
```
you will get en error message, since this would like to invoke 32 as a function :

```
error in file: /opt/code/mysuperproject/js_source/forms.js
    2 : (function(text){ console.log(text) })(myNumber), 
```

### When does an error occures?
if a line starts with one of these :
```
/ + - * ( [ & % | < > = ^
```
Of course, an error is only raised if the error is real, for example this will not cause and error:
```
if (
    (cat && dog) &&
    (turtle && penguin)
)
++animalPairsCount
```
because the & symbol clearly signals that you want to continue on the next line, since there is no other meaning for symbol without a next statement, after that the double plus signs will close the previous statement

## Usage:

This will recoursively check all folders and files, if the file extension matches
```javascript
var semiless = require('semiless')
var errors = semiless.fileChecker('js_source', [.js, .ts])

if (errors) {
    console.error(errors)
} else {
    console.log('no error found in source files')
 }


```