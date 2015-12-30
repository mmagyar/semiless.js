/** Copyright 2015 Magyar Mate under MIT */
var fs   = require('fs');
var path = require('path');

function checkValidStatementBeginning(fileContent) {
    var createCheckerState = function () {
        return {
            errorLines    : [],
            inComment     : false,
            lastLineEnding: ''
        }
    }

    var checkerState = createCheckerState()

    var illegalStringStart = function (string) {
        var first  = string[0]
        var second = string[1]
        switch (first) {
            case '/':
                return second === '/' ? false : (second !== '*')
            case '+':
                return second !== '+';
            case '-':
                return second !== '-'
            case '*':
                return second !== '/'
            case '(':
            case '[':
            case '&':
            case '%':
            case '|':
            case '<':
            case '>':
            case '=':
            case '^':
                return true
            default :
                return false
        }
    }

    var lineStat = function (index, line) {
        return {
            index: index,
            line : line

        }
    }


    var checkLineByCharacter = function (line, checkerState) {
        var lastEnding              = checkerState.lastLineEnding
        checkerState.lastLineEnding = line[line.length - 1] || ""

        //We don't need to worry if the preceding character is a comma, semicolon, opening paren|bracket|braces on the last line, since it closes the statement,
        //Or a character that clearly signals that we want continue, like a plus sing at the end of the line
        //Also opening a new block clears any pending statements
        return !!(
            lastEnding == "," ||
            lastEnding == ";" ||
            lastEnding == ":" ||
            lastEnding == "{" ||
            illegalStringStart(lastEnding)
        );


    }

    //TODO make the parser recursive, separate every function, and process and innard functions recusively

    var processLine = function (line, i) {

        var lineCommentIndex = line.indexOf('//')
        var commentOpenIndex = line.indexOf('/*')
        //You can comment out the start of a comment block with line block
        if (lineCommentIndex !== -1 && lineCommentIndex < commentOpenIndex) commentOpenIndex = -1

        var commentCloseIndex = line.indexOf('*/')
        if (commentOpenIndex === 0) checkerState.inComment = true

        if (commentCloseIndex != -1) {
            checkerState.inComment = false
            return
        }

        if ((  checkerState.inComment || lineCommentIndex === 0)) return


        if (checkLineByCharacter(line, checkerState)) return
        if (illegalStringStart(line)) checkerState.errorLines.push(lineStat(i, line))
        if (commentOpenIndex !== -1) checkerState.inComment = true

    }


    fileContent.split('\n').map(function (x) {return x.trim()}).forEach(processLine)
    return checkerState.errorLines

}


var walk = function (dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) throw err;
        var pending = list.length;
        if (!pending) return done(results);
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    results.push(file);
                    if (!--pending) done(null, results);
                }
            });
        });
    });
};


function hasArray(arr) {
    for (var i = 0, l = arr.length; i < l; i++) if (arr[i] instanceof Array) return true
    return false
}

var flatten = function (list) {return list.reduce(function (p, n) {return p.concat(n);}, [])};

var walkSync = function (dir) {
    return flatten(fs.readdirSync(dir).map(function (x) {return path.resolve(dir, x)})
                     .map(function (file) {return fs.statSync(file).isDirectory() ? walkSync(file) : file}))
}

/**
 *
 * @param pathToList string
 * @param extensionsToWatch string[]
 */
var walkFilter = function (pathToList, extensionsToWatch) {
    return walkSync(pathToList).filter(function (x) {return extensionsToWatch.filter(function (y) {return y === path.extname(x)}).length !== 0})
}


/**
 *
 * @param folderToCheck string
 * @param fileExtensionsToCheck string[] the extension of the watched files, must include the dot before extension, like: ['.ts', '.js']
 * @param filesEncoding defaults to utf8
 * @returns {*}
 */
function fileChecker(folderToCheck, fileExtensionsToCheck, filesEncoding) {
    var files        = walkFilter(folderToCheck || 'ts', fileExtensionsToCheck || ['.ts', '.js'])
    var filesContent = files.map(function (x) {return fs.readFileSync(x, filesEncoding || 'utf8')})

    return filesContent
        .map(checkValidStatementBeginning)
        .map(function (x, i) {return {fileName: files[i], error: x}})
        .filter(function (x) { return x.error.length !== 0})
        .map(function (x) {return "error in file: " + x.fileName + x.error.map(function (y) {return "\n    " + (y.index + 1) + " : " + y.line})})
        .reduce(function (x, y) {return x + '\n' + y}, "")


}

module.exports.fileChecker = fileChecker