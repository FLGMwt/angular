'use strict';"use strict";
var exceptions_1 = require('angular2/src/facade/exceptions');
var lang_1 = require('angular2/src/facade/lang');
// asset:<package-name>/<realm>/<path-to-module>
var _ASSET_URL_RE = /asset:([^\/]+)\/([^\/]+)\/(.+)/g;
var _PATH_SEP = '/';
var _PATH_SEP_RE = /\//g;
(function (ImportEnv) {
    ImportEnv[ImportEnv["Dart"] = 0] = "Dart";
    ImportEnv[ImportEnv["JS"] = 1] = "JS";
})(exports.ImportEnv || (exports.ImportEnv = {}));
var ImportEnv = exports.ImportEnv;
/**
 * Returns the module path to use for an import.
 */
function getImportModulePath(moduleUrlStr, importedUrlStr, importEnv) {
    var absolutePathPrefix = importEnv === ImportEnv.Dart ? "package:" : '';
    var moduleUrl = _AssetUrl.parse(moduleUrlStr, false);
    var importedUrl = _AssetUrl.parse(importedUrlStr, true);
    if (lang_1.isBlank(importedUrl)) {
        return importedUrlStr;
    }
    // Try to create a relative path first
    if (moduleUrl.firstLevelDir == importedUrl.firstLevelDir &&
        moduleUrl.packageName == importedUrl.packageName) {
        return getRelativePath(moduleUrl.modulePath, importedUrl.modulePath, importEnv);
    }
    else if (importedUrl.firstLevelDir == 'lib') {
        return "" + absolutePathPrefix + importedUrl.packageName + "/" + importedUrl.modulePath;
    }
    throw new exceptions_1.BaseException("Can't import url " + importedUrlStr + " from " + moduleUrlStr);
}
exports.getImportModulePath = getImportModulePath;
var _AssetUrl = (function () {
    function _AssetUrl(packageName, firstLevelDir, modulePath) {
        this.packageName = packageName;
        this.firstLevelDir = firstLevelDir;
        this.modulePath = modulePath;
    }
    _AssetUrl.parse = function (url, allowNonMatching) {
        var match = lang_1.RegExpWrapper.firstMatch(_ASSET_URL_RE, url);
        if (lang_1.isPresent(match)) {
            return new _AssetUrl(match[1], match[2], match[3]);
        }
        if (allowNonMatching) {
            return null;
        }
        throw new exceptions_1.BaseException("Url " + url + " is not a valid asset: url");
    };
    return _AssetUrl;
}());
function getRelativePath(modulePath, importedPath, importEnv) {
    var moduleParts = modulePath.split(_PATH_SEP_RE);
    var importedParts = importedPath.split(_PATH_SEP_RE);
    var longestPrefix = getLongestPathSegmentPrefix(moduleParts, importedParts);
    var resultParts = [];
    var goParentCount = moduleParts.length - 1 - longestPrefix;
    for (var i = 0; i < goParentCount; i++) {
        resultParts.push('..');
    }
    if (goParentCount <= 0 && importEnv === ImportEnv.JS) {
        resultParts.push('.');
    }
    for (var i = longestPrefix; i < importedParts.length; i++) {
        resultParts.push(importedParts[i]);
    }
    return resultParts.join(_PATH_SEP);
}
exports.getRelativePath = getRelativePath;
function getLongestPathSegmentPrefix(arr1, arr2) {
    var prefixSize = 0;
    var minLen = lang_1.Math.min(arr1.length, arr2.length);
    while (prefixSize < minLen && arr1[prefixSize] == arr2[prefixSize]) {
        prefixSize++;
    }
    return prefixSize;
}
exports.getLongestPathSegmentPrefix = getLongestPathSegmentPrefix;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aF91dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGlmZmluZ19wbHVnaW5fd3JhcHBlci1vdXRwdXRfcGF0aC1iT1VqVEczZy50bXAvYW5ndWxhcjIvc3JjL2NvbXBpbGVyL291dHB1dC9wYXRoX3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJCQUE0QixnQ0FBZ0MsQ0FBQyxDQUFBO0FBQzdELHFCQUFzRCwwQkFBMEIsQ0FBQyxDQUFBO0FBRWpGLGdEQUFnRDtBQUNoRCxJQUFJLGFBQWEsR0FBRyxpQ0FBaUMsQ0FBQztBQUV0RCxJQUFJLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFDcEIsSUFBSSxZQUFZLEdBQUcsS0FBSyxDQUFDO0FBRXpCLFdBQVksU0FBUztJQUNuQix5Q0FBSSxDQUFBO0lBQ0oscUNBQUUsQ0FBQTtBQUNKLENBQUMsRUFIVyxpQkFBUyxLQUFULGlCQUFTLFFBR3BCO0FBSEQsSUFBWSxTQUFTLEdBQVQsaUJBR1gsQ0FBQTtBQUVEOztHQUVHO0FBQ0gsNkJBQW9DLFlBQW9CLEVBQUUsY0FBc0IsRUFDNUMsU0FBb0I7SUFDdEQsSUFBSSxrQkFBa0IsR0FBVyxTQUFTLEtBQUssU0FBUyxDQUFDLElBQUksR0FBRyxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ2hGLElBQUksU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3JELElBQUksV0FBVyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hELEVBQUUsQ0FBQyxDQUFDLGNBQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekIsTUFBTSxDQUFDLGNBQWMsQ0FBQztJQUN4QixDQUFDO0lBRUQsc0NBQXNDO0lBQ3RDLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxhQUFhLElBQUksV0FBVyxDQUFDLGFBQWE7UUFDcEQsU0FBUyxDQUFDLFdB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QyxJQUFjLEVBQUUsSUFBYztJQUN4RSxJQUFJLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDbkIsSUFBSSxNQUFNLEdBQUcsV0FBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNoRCxPQUFPLFVBQVUsR0FBRyxNQUFNLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBQ25FLFVBQVUsRUFBRSxDQUFDO0lBQ2YsQ0FBQztJQUNELE1BQU0sQ0FBQyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQVBlLG1DQUEyQiw4QkFPMUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7QmFzZUV4Y2VwdGlvbn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9leGNlcHRpb25zJztcbmltcG9ydCB7aXNQcmVzZW50LCBpc0JsYW5rLCBSZWdFeHBXcmFwcGVyLCBNYXRofSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2xhbmcnO1xuXG4vLyBhc3NldDo8cGFja2FnZS1uYW1lPi88cmVhbG0+LzxwYXRoLXRvLW1vZHVsZT5cbnZhciBfQVNTRVRfVVJMX1JFID0gL2Fzc2V0OihbXlxcL10rKVxcLyhbXlxcL10rKVxcLyguKykvZztcblxudmFyIF9QQVRIX1NFUCA9ICcvJztcbnZhciBfUEFUSF9TRVBfUkUgPSAvXFwvL2c7XG5cbmV4cG9ydCBlbnVtIEltcG9ydEVudiB7XG4gIERhcnQsXG4gIEpTXG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbW9kdWxlIHBhdGggdG8gdXNlIGZvciBhbiBpbXBvcnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbXBvcnRNb2R1bGVQYXRoKG1vZHVsZVVybFN0cjogc3RyaW5nLCBpbXBvcnRlZFVybFN0cjogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0RW52OiBJbXBvcnRFbnYpOiBzdHJpbmcge1xuICB2YXIgYWJzb2x1dGVQYXRoUHJlZml4OiBzdHJpbmcgPSBpbXBvcnRFbnYgPT09IEltcG9ydEVudi5EYXJ0ID8gYHBhY2thZ2U6YCA6ICcnO1xuICB2YXIgbW9kdWxlVXJsID0gX0Fzc2V0VXJsLnBhcnNlKG1vZHVsZVVybFN0ciwgZmFsc2UpO1xuICB2YXIgaW1wb3J0ZWRVcmwgPSBfQXNzZXRVcmwucGFyc2UoaW1wb3J0ZWRVcmxTdHIsIHRydWUpO1xuICBpZiAoaXNCbGFuayhpbXBvcnRlZFVybCkpIHtcbiAgICByZXR1cm4gaW1wb3J0ZWRVcmxTdHI7XG4gIH1cblxuICAvLyBUcnkgdG8gY3JlYXRlIGEgcmVsYXRpdmUgcGF0aCBmaXJzdFxuICBpZiAobW9kdWxlVXJsLmZpcnN0TGV2ZWxEaXIgPT0gaW1wb3J0ZWRVcmwuZmlyc3RMZXZlbERpciAmJlxuICAgICAgbW9kdWxlVXJsLnBhY2thZ2VOYW1lID09IGltcG9ydGVkVXJsLnBhY2thZ2VOYW1lKSB7XG4gICAgcmV0dXJuIGdldFJlbGF0aXZlUGF0aChtb2R1bGVVcmwubW9kdWxlUGF0aCwgaW1wb3J0ZWRVcmwubW9kdWxlUGF0aCwgaW1wb3J0RW52KTtcbiAgfSBlbHNlIGlmIChpbXBvcnRlZFVybC5maXJzdExldmVsRGlyID09ICdsaWInKSB7XG4gICAgcmV0dXJuIGAke2Fic29sdXRlUGF0aFByZWZpeH0ke2ltcG9ydGVkVXJsLnBhY2thZ2VOYW1lfS8ke2ltcG9ydGVkVXJsLm1vZHVsZVBhdGh9YDtcbiAgfVxuICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbihgQ2FuJ3QgaW1wb3J0IHVybCAke2ltcG9ydGVkVXJsU3RyfSBmcm9tICR7bW9kdWxlVXJsU3RyfWApO1xufVxuXG5jbGFzcyBfQXNzZXRVcmwge1xuICBzdGF0aWMgcGFyc2UodXJsOiBzdHJpbmcsIGFsbG93Tm9uTWF0Y2hpbmc6IGJvb2xlYW4pOiBfQXNzZXRVcmwge1xuICAgIHZhciBtYXRjaCA9IFJlZ0V4cFdyYXBwZXIuZmlyc3RNYXRjaChfQVNTRVRfVVJMX1JFLCB1cmwpO1xuICAgIGlmIChpc1ByZXNlbnQobWF0Y2gpKSB7XG4gICAgICByZXR1cm4gbmV3IF9Bc3NldFVybChtYXRjaFsxXSwgbWF0Y2hbMl0sIG1hdGNoWzNdKTtcbiAgICB9XG4gICAgaWYgKGFsbG93Tm9uTWF0Y2hpbmcpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQmFzZUV4Y2VwdGlvbihgVXJsICR7dXJsfSBpcyBub3QgYSB2YWxpZCBhc3NldDogdXJsYCk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgcGFja2FnZU5hbWU6IHN0cmluZywgcHVibGljIGZpcnN0TGV2ZWxEaXI6IHN0cmluZywgcHVibGljIG1vZHVsZVBhdGg6IHN0cmluZykge1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZWxhdGl2ZVBhdGgobW9kdWxlUGF0aDogc3RyaW5nLCBpbXBvcnRlZFBhdGg6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0RW52OiBJbXBvcnRFbnYpOiBzdHJpbmcge1xuICB2YXIgbW9kdWxlUGFydHMgPSBtb2R1bGVQYXRoLnNwbGl0KF9QQVRIX1NFUF9SRSk7XG4gIHZhciBpbXBvcnRlZFBhcnRzID0gaW1wb3J0ZWRQYXRoLnNwbGl0KF9QQVRIX1NFUF9SRSk7XG4gIHZhciBsb25nZXN0UHJlZml4ID0gZ2V0TG9uZ2VzdFBhdGhTZWdtZW50UHJlZml4KG1vZHVsZVBhcnRzLCBpbXBvcnRlZFBhcnRzKTtcblxuICB2YXIgcmVzdWx0UGFydHMgPSBbXTtcbiAgdmFyIGdvUGFyZW50Q291bnQgPSBtb2R1bGVQYXJ0cy5sZW5ndGggLSAxIC0gbG9uZ2VzdFByZWZpeDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBnb1BhcmVudENvdW50OyBpKyspIHtcbiAgICByZXN1bHRQYXJ0cy5wdXNoKCcuLicpO1xuICB9XG4gIGlmIChnb1BhcmVudENvdW50IDw9IDAgJiYgaW1wb3J0RW52ID09PSBJbXBvcnRFbnYuSlMpIHtcbiAgICByZXN1bHRQYXJ0cy5wdXNoKCcuJyk7XG4gIH1cbiAgZm9yICh2YXIgaSA9IGxvbmdlc3RQcmVmaXg7IGkgPCBpbXBvcnRlZFBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVzdWx0UGFydHMucHVzaChpbXBvcnRlZFBhcnRzW2ldKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0UGFydHMuam9pbihfUEFUSF9TRVApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9uZ2VzdFBhdGhTZWdtZW50UHJlZml4KGFycjE6IHN0cmluZ1tdLCBhcnIyOiBzdHJpbmdbXSk6IG51bWJlciB7XG4gIHZhciBwcmVmaXhTaXplID0gMDtcbiAgdmFyIG1pbkxlbiA9IE1hdGgubWluKGFycjEubGVuZ3RoLCBhcnIyLmxlbmd0aCk7XG4gIHdoaWxlIChwcmVmaXhTaXplIDwgbWluTGVuICYmIGFycjFbcHJlZml4U2l6ZV0gPT0gYXJyMltwcmVmaXhTaXplXSkge1xuICAgIHByZWZpeFNpemUrKztcbiAgfVxuICByZXR1cm4gcHJlZml4U2l6ZTtcbn1cbiJdfQ==