'use strict';"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var segments_1 = require('./segments');
var exceptions_1 = require('angular2/src/facade/exceptions');
var lang_1 = require('angular2/src/facade/lang');
var RouterUrlSerializer = (function () {
    function RouterUrlSerializer() {
    }
    return RouterUrlSerializer;
}());
exports.RouterUrlSerializer = RouterUrlSerializer;
var DefaultRouterUrlSerializer = (function (_super) {
    __extends(DefaultRouterUrlSerializer, _super);
    function DefaultRouterUrlSerializer() {
        _super.apply(this, arguments);
    }
    DefaultRouterUrlSerializer.prototype.parse = function (url) {
        var root = new _UrlParser().parse(url);
        return new segments_1.Tree(root);
    };
    DefaultRouterUrlSerializer.prototype.serialize = function (tree) { return _serializeUrlTreeNode(segments_1.rootNode(tree)); };
    return DefaultRouterUrlSerializer;
}(RouterUrlSerializer));
exports.DefaultRouterUrlSerializer = DefaultRouterUrlSerializer;
function _serializeUrlTreeNode(node) {
    return "" + node.value + _serializeChildren(node);
}
function _serializeUrlTreeNodes(nodes) {
    var main = nodes[0].value.toString();
    var auxNodes = nodes.slice(1);
    var aux = auxNodes.length > 0 ? "(" + auxNodes.map(_serializeUrlTreeNode).join("//") + ")" : "";
    var children = _serializeChildren(nodes[0]);
    return "" + main + aux + children;
}
function _serializeChildren(node) {
    if (node.children.length > 0) {
        var slash = lang_1.isBlank(node.children[0].value.segment) ? "" : "/";
        return "" + slash + _serializeUrlTreeNodes(node.children);
    }
    else {
        return "";
    }
}
var SEGMENT_RE = lang_1.RegExpWrapper.create('^[^\\/\\(\\)\\?;=&#]+');
function matchUrlSegment(str) {
    var match = lang_1.RegExpWrapper.firstMatch(SEGMENT_RE, str);
    return lang_1.isPresent(match) ? match[0] : '';
}
var QUERY_PARAM_VALUE_RE = lang_1.RegExpWrapper.create('^[^\\(\\)\\?;&#]+');
function matchUrlQueryParamValue(str) {
    var match = lang_1.RegExpWrapper.firstMatch(QUERY_PARAM_VALUE_RE, str);
    return lang_1.isPresent(match) ? match[0] : '';
}
var _UrlParser = (function () {
    function _UrlParser() {
    }
    _UrlParser.prototype.peekStartsWith = function (str) { return this._remaining.startsWith(str); };
    _UrlParser.prototype.capture = function (str) {
        if (!this._remaining.startsWith(str)) {
            throw new exceptions_1.BaseException("Expected \"" + str + "\".");
        }
        this._remaining = this._remaining.substring(str.length);
    };
    _UrlParser.prototype.parse = function (url) {
        this._remaining = url;
        if (url == '' || url == '/') {
            return new segments_1.TreeNode(new segments_1.UrlSegment('', null, null), []);
        }
        else {
            return this.parseRoot();
        }
    };
    _UrlParser.prototype.parseRoot = function () {
        var segments = this.parseSegments();
        var queryParams = this.peekStartsWith('?') ? this.parseQueryParams() : null;
        return new segments_1.TreeNode(new segments_1.UrlSegment('', queryParams, null), segments);
    };
    _UrlParser.prototype.parseSegments = function (outletName) {
        if (outletName === void 0) { outletName = null; }
        if (this._remaining.length == 0) {
            return [];
        }
        if (this.peekStartsWith('/')) {
            this.capture('/');
        }
        var path = matchUrlSegment(this._remaining);
        this.capture(path);
        if (path.indexOf(":") > -1) {
            var parts = path.split(":");
            outletName = parts[0];
            path = parts[1];
        }
        var matrixParams = null;
        if (this.peekStartsWith(';')) {
            matrixParams = this.parseMatrixParams();
        }
        var aux = [];
        if (this.peekStartsWith('(')) {
            aux = this.parseAuxiliaryRoutes();
        }
        var children = [];
        if (this.peekStartsWith('/') && !this.peekStartsWith('//')) {
            this.capture('/');
            children = this.parseSegments();
        }
        if (lang_1.isPresent(matrixParams)) {
            var matrixParamsSegment = new segments_1.UrlSegment(null, matrixParams, null);
            var matrixParamsNode = new segments_1.TreeNode(matrixParamsSegment, children);
            var segment = new segments_1.UrlSegment(path, null, outletName);
            return [new segments_1.TreeNode(segment, [matrixParamsNode].concat(aux))];
        }
        else {
            var segment = new segments_1.UrlSegment(path, null, outletName);
            var node = new segments_1.TreeNode(segment, children);
            return [node].concat(aux);
        }
    };
    _UrlParser.prototype.parseQueryParams = function () {
        var params = {};
        this.capture('?');
        this.parseQueryParam(params);
        while (this._remaining.length > 0 && this.peekStartsWith('&')) {
            this.capture('&');
            this.parseQueryParam(params);
        }
        return params;
    };
    _UrlParser.prototype.parseMatrixParams = function () {
        var params = {};
        while (this._remaining.length > 0 && this.peekStartsWith(';')) {
            this.capture(';');
            this.parseParam(params);
        }
        return params;
    };
    _UrlParser.prototype.parseParam = function (params) {
        var key = matchUrlSegment(this._remaining);
        if (lang_1.isBlank(key)) {
            return;
        }
        this.capture(key);
        var value = "true";
        if (this.peekStartsWith('=')) {
            this.capture('=');
            var valueMatch = matchUrlSegment(this._remaining);
            if (lang_1.isPresent(valueMatch)) {
                value = valueMatch;
                this.capture(value);
            }
        }
        params[key] = value;
    };
    _UrlParser.prototype.parseQueryParam = function (params) {
        var key = matchUrlSegment(this._remaining);
        if (lang_1.isBlank(key)) {
            return;
        }
        this.capture(key);
        var value = "true";
        if (this.peekStartsWith('=')) {
            this.capture('=');
            var valueMatch = matchUrlQueryParamValue(this._remaining);
            if (lang_1.isPresent(valueMatch)) {
                value = valueMatch;
                this.capture(value);
            }
        }
        params[key] = value;
    };
    _UrlParser.prototype.parseAuxiliaryRoutes = function () {
        var segments = [];
        this.capture('(');
        while (!this.peekStartsWith(')') && this._remaining.length > 0) {
            segments = segments.concat(this.parseSegments("aux"));
            if (this.peekStartsWith('//')) {
                this.capture('//');
            }
        }
        this.capture(')');
        return segments;
    };
    return _UrlParser;
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVyX3VybF9zZXJpYWxpemVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGlmZmluZ19wbHVnaW5fd3JhcHBlci1vdXRwdXRfcGF0aC1iT1VqVEczZy50bXAvYW5ndWxhcjIvc3JjL2FsdF9yb3V0ZXIvcm91dGVyX3VybF9zZXJpYWxpemVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHlCQUFtRCxZQUFZLENBQUMsQ0FBQTtBQUNoRSwyQkFBNEIsZ0NBQWdDLENBQUMsQ0FBQTtBQUM3RCxxQkFBZ0QsMEJBQTBCLENBQUMsQ0FBQTtBQUczRTtJQUFBO0lBR0EsQ0FBQztJQUFELDBCQUFDO0FBQUQsQ0FBQyxBQUhELElBR0M7QUFIcUIsMkJBQW1CLHNCQUd4QyxDQUFBO0FBRUQ7SUFBZ0QsOENBQW1CO0lBQW5FO1FBQWdELDhCQUFtQjtJQU9uRSxDQUFDO0lBTkMsMENBQUssR0FBTCxVQUFNLEdBQVc7UUFDZixJQUFJLElBQUksR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QyxNQUFNLENBQUMsSUFBSSxlQUFJLENBQWEsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELDhDQUFTLEdBQVQsVUFBVSxJQUFzQixJQUFZLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdGLGlDQUFDO0FBQUQsQ0FBQyxBQVBELENBQWdELG1CQUFtQixHQU9sRTtBQVBZLGtDQUEwQiw2QkFPdEMsQ0FBQTtBQUVELCtCQUErQixJQUEwQjtJQUN2RCxNQUFNLENBQUMsS0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBRyxDQUFDO0FBQ3BELENBQUM7QUFFRCxnQ0FBZ0MsS0FBNkI7SUFDM0QsSUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxR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LEdBQUcsQ0FBQyxDQUFDO1lBQ2xCLElBQUksVUFBVSxHQUFHLHVCQUF1QixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMxRCxFQUFFLENBQUMsQ0FBQyxnQkFBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDMUIsS0FBSyxHQUFHLFVBQVUsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QixDQUFDO1FBQ0gsQ0FBQztRQUVELE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7SUFDdEIsQ0FBQztJQUVELHlDQUFvQixHQUFwQjtRQUNFLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNsQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRWxCLE9BQU8sQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQy9ELFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUN0RCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQixDQUFDO1FBQ0gsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFbEIsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBaEpELElBZ0pDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtVcmxTZWdtZW50LCBUcmVlLCBUcmVlTm9kZSwgcm9vdE5vZGV9IGZyb20gJy4vc2VnbWVudHMnO1xuaW1wb3J0IHtCYXNlRXhjZXB0aW9ufSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2V4Y2VwdGlvbnMnO1xuaW1wb3J0IHtpc0JsYW5rLCBpc1ByZXNlbnQsIFJlZ0V4cFdyYXBwZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvbGFuZyc7XG5pbXBvcnQge0xpc3RXcmFwcGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2NvbGxlY3Rpb24nO1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgUm91dGVyVXJsU2VyaWFsaXplciB7XG4gIGFic3RyYWN0IHBhcnNlKHVybDogc3RyaW5nKTogVHJlZTxVcmxTZWdtZW50PjtcbiAgYWJzdHJhY3Qgc2VyaWFsaXplKHRyZWU6IFRyZWU8VXJsU2VnbWVudD4pOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBEZWZhdWx0Um91dGVyVXJsU2VyaWFsaXplciBleHRlbmRzIFJvdXRlclVybFNlcmlhbGl6ZXIge1xuICBwYXJzZSh1cmw6IHN0cmluZyk6IFRyZWU8VXJsU2VnbWVudD4ge1xuICAgIGxldCByb290ID0gbmV3IF9VcmxQYXJzZXIoKS5wYXJzZSh1cmwpO1xuICAgIHJldHVybiBuZXcgVHJlZTxVcmxTZWdtZW50Pihyb290KTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSh0cmVlOiBUcmVlPFVybFNlZ21lbnQ+KTogc3RyaW5nIHsgcmV0dXJuIF9zZXJpYWxpemVVcmxUcmVlTm9kZShyb290Tm9kZSh0cmVlKSk7IH1cbn1cblxuZnVuY3Rpb24gX3NlcmlhbGl6ZVVybFRyZWVOb2RlKG5vZGU6IFRyZWVOb2RlPFVybFNlZ21lbnQ+KTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke25vZGUudmFsdWV9JHtfc2VyaWFsaXplQ2hpbGRyZW4obm9kZSl9YDtcbn1cblxuZnVuY3Rpb24gX3NlcmlhbGl6ZVVybFRyZWVOb2Rlcyhub2RlczogVHJlZU5vZGU8VXJsU2VnbWVudD5bXSk6IHN0cmluZyB7XG4gIGxldCBtYWluID0gbm9kZXNbMF0udmFsdWUudG9TdHJpbmcoKTtcbiAgbGV0IGF1eE5vZGVzID0gbm9kZXMuc2xpY2UoMSk7XG4gIGxldCBhdXggPSBhdXhOb2Rlcy5sZW5ndGggPiAwID8gYCgke2F1eE5vZGVzLm1hcChfc2VyaWFsaXplVXJsVHJlZU5vZGUpLmpvaW4oXCIvL1wiKX0pYCA6IFwiXCI7XG4gIGxldCBjaGlsZHJlbiA9IF9zZXJpYWxpemVDaGlsZHJlbihub2Rlc1swXSk7XG4gIHJldHVybiBgJHttYWlufSR7YXV4fSR7Y2hpbGRyZW59YDtcbn1cblxuZnVuY3Rpb24gX3NlcmlhbGl6ZUNoaWxkcmVuKG5vZGU6IFRyZWVOb2RlPFVybFNlZ21lbnQ+KTogc3RyaW5nIHtcbiAgaWYgKG5vZGUuY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgIGxldCBzbGFzaCA9IGlzQmxhbmsobm9kZS5jaGlsZHJlblswXS52YWx1ZS5zZWdtZW50KSA/IFwiXCIgOiBcIi9cIjtcbiAgICByZXR1cm4gYCR7c2xhc2h9JHtfc2VyaWFsaXplVXJsVHJlZU5vZGVzKG5vZGUuY2hpbGRyZW4pfWA7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxudmFyIFNFR01FTlRfUkUgPSBSZWdFeHBXcmFwcGVyLmNyZWF0ZSgnXlteXFxcXC9cXFxcKFxcXFwpXFxcXD87PSYjXSsnKTtcbmZ1bmN0aW9uIG1hdGNoVXJsU2VnbWVudChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIHZhciBtYXRjaCA9IFJlZ0V4cFdyYXBwZXIuZmlyc3RNYXRjaChTRUdNRU5UX1JFLCBzdHIpO1xuICByZXR1cm4gaXNQcmVzZW50KG1hdGNoKSA/IG1hdGNoWzBdIDogJyc7XG59XG52YXIgUVVFUllfUEFSQU1fVkFMVUVfUkUgPSBSZWdFeHBXcmFwcGVyLmNyZWF0ZSgnXlteXFxcXChcXFxcKVxcXFw/OyYjXSsnKTtcbmZ1bmN0aW9uIG1hdGNoVXJsUXVlcnlQYXJhbVZhbHVlKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgdmFyIG1hdGNoID0gUmVnRXhwV3JhcHBlci5maXJzdE1hdGNoKFFVRVJZX1BBUkFNX1ZBTFVFX1JFLCBzdHIpO1xuICByZXR1cm4gaXNQcmVzZW50KG1hdGNoKSA/IG1hdGNoWzBdIDogJyc7XG59XG5cbmNsYXNzIF9VcmxQYXJzZXIge1xuICBwcml2YXRlIF9yZW1haW5pbmc6IHN0cmluZztcblxuICBwZWVrU3RhcnRzV2l0aChzdHI6IHN0cmluZyk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5fcmVtYWluaW5nLnN0YXJ0c1dpdGgoc3RyKTsgfVxuXG4gIGNhcHR1cmUoc3RyOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuX3JlbWFpbmluZy5zdGFydHNXaXRoKHN0cikpIHtcbiAgICAgIHRocm93IG5ldyBCYXNlRXhjZXB0aW9uKGBFeHBlY3RlZCBcIiR7c3RyfVwiLmApO1xuICAgIH1cbiAgICB0aGlzLl9yZW1haW5pbmcgPSB0aGlzLl9yZW1haW5pbmcuc3Vic3RyaW5nKHN0ci5sZW5ndGgpO1xuICB9XG5cbiAgcGFyc2UodXJsOiBzdHJpbmcpOiBUcmVlTm9kZTxVcmxTZWdtZW50PiB7XG4gICAgdGhpcy5fcmVtYWluaW5nID0gdXJsO1xuICAgIGlmICh1cmwgPT0gJycgfHwgdXJsID09ICcvJykge1xuICAgICAgcmV0dXJuIG5ldyBUcmVlTm9kZTxVcmxTZWdtZW50PihuZXcgVXJsU2VnbWVudCgnJywgbnVsbCwgbnVsbCksIFtdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VSb290KCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VSb290KCk6IFRyZWVOb2RlPFVybFNlZ21lbnQ+IHtcbiAgICBsZXQgc2VnbWVudHMgPSB0aGlzLnBhcnNlU2VnbWVudHMoKTtcbiAgICBsZXQgcXVlcnlQYXJhbXMgPSB0aGlzLnBlZWtTdGFydHNXaXRoKCc/JykgPyB0aGlzLnBhcnNlUXVlcnlQYXJhbXMoKSA6IG51bGw7XG4gICAgcmV0dXJuIG5ldyBUcmVlTm9kZTxVcmxTZWdtZW50PihuZXcgVXJsU2VnbWVudCgnJywgcXVlcnlQYXJhbXMsIG51bGwpLCBzZWdtZW50cyk7XG4gIH1cblxuICBwYXJzZVNlZ21lbnRzKG91dGxldE5hbWU6IHN0cmluZyA9IG51bGwpOiBUcmVlTm9kZTxVcmxTZWdtZW50PltdIHtcbiAgICBpZiAodGhpcy5fcmVtYWluaW5nLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCcvJykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnLycpO1xuICAgIH1cbiAgICB2YXIgcGF0aCA9IG1hdGNoVXJsU2VnbWVudCh0aGlzLl9yZW1haW5pbmcpO1xuICAgIHRoaXMuY2FwdHVyZShwYXRoKTtcblxuXG4gICAgaWYgKHBhdGguaW5kZXhPZihcIjpcIikgPiAtMSkge1xuICAgICAgbGV0IHBhcnRzID0gcGF0aC5zcGxpdChcIjpcIik7XG4gICAgICBvdXRsZXROYW1lID0gcGFydHNbMF07XG4gICAgICBwYXRoID0gcGFydHNbMV07XG4gICAgfVxuXG4gICAgdmFyIG1hdHJpeFBhcmFtczoge1trZXk6IHN0cmluZ106IGFueX0gPSBudWxsO1xuICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCc7JykpIHtcbiAgICAgIG1hdHJpeFBhcmFtcyA9IHRoaXMucGFyc2VNYXRyaXhQYXJhbXMoKTtcbiAgICB9XG5cbiAgICB2YXIgYXV4ID0gW107XG4gICAgaWYgKHRoaXMucGVla1N0YXJ0c1dpdGgoJygnKSkge1xuICAgICAgYXV4ID0gdGhpcy5wYXJzZUF1eGlsaWFyeVJvdXRlcygpO1xuICAgIH1cblxuICAgIHZhciBjaGlsZHJlbjogVHJlZU5vZGU8VXJsU2VnbWVudD5bXSA9IFtdO1xuICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCcvJykgJiYgIXRoaXMucGVla1N0YXJ0c1dpdGgoJy8vJykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnLycpO1xuICAgICAgY2hpbGRyZW4gPSB0aGlzLnBhcnNlU2VnbWVudHMoKTtcbiAgICB9XG5cbiAgICBpZiAoaXNQcmVzZW50KG1hdHJpeFBhcmFtcykpIHtcbiAgICAgIGxldCBtYXRyaXhQYXJhbXNTZWdtZW50ID0gbmV3IFVybFNlZ21lbnQobnVsbCwgbWF0cml4UGFyYW1zLCBudWxsKTtcbiAgICAgIGxldCBtYXRyaXhQYXJhbXNOb2RlID0gbmV3IFRyZWVOb2RlPFVybFNlZ21lbnQ+KG1hdHJpeFBhcmFtc1NlZ21lbnQsIGNoaWxkcmVuKTtcbiAgICAgIGxldCBzZWdtZW50ID0gbmV3IFVybFNlZ21lbnQocGF0aCwgbnVsbCwgb3V0bGV0TmFtZSk7XG4gICAgICByZXR1cm4gW25ldyBUcmVlTm9kZTxVcmxTZWdtZW50PihzZWdtZW50LCBbbWF0cml4UGFyYW1zTm9kZV0uY29uY2F0KGF1eCkpXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHNlZ21lbnQgPSBuZXcgVXJsU2VnbWVudChwYXRoLCBudWxsLCBvdXRsZXROYW1lKTtcbiAgICAgIGxldCBub2RlID0gbmV3IFRyZWVOb2RlPFVybFNlZ21lbnQ+KHNlZ21lbnQsIGNoaWxkcmVuKTtcbiAgICAgIHJldHVybiBbbm9kZV0uY29uY2F0KGF1eCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VRdWVyeVBhcmFtcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgdmFyIHBhcmFtczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgICB0aGlzLmNhcHR1cmUoJz8nKTtcbiAgICB0aGlzLnBhcnNlUXVlcnlQYXJhbShwYXJhbXMpO1xuICAgIHdoaWxlICh0aGlzLl9yZW1haW5pbmcubGVuZ3RoID4gMCAmJiB0aGlzLnBlZWtTdGFydHNXaXRoKCcmJykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnJicpO1xuICAgICAgdGhpcy5wYXJzZVF1ZXJ5UGFyYW0ocGFyYW1zKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmFtcztcbiAgfVxuXG4gIHBhcnNlTWF0cml4UGFyYW1zKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICB2YXIgcGFyYW1zOiB7W2tleTogc3RyaW5nXTogYW55fSA9IHt9O1xuICAgIHdoaWxlICh0aGlzLl9yZW1haW5pbmcubGVuZ3RoID4gMCAmJiB0aGlzLnBlZWtTdGFydHNXaXRoKCc7JykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnOycpO1xuICAgICAgdGhpcy5wYXJzZVBhcmFtKHBhcmFtcyk7XG4gICAgfVxuICAgIHJldHVybiBwYXJhbXM7XG4gIH1cblxuICBwYXJzZVBhcmFtKHBhcmFtczoge1trZXk6IHN0cmluZ106IGFueX0pOiB2b2lkIHtcbiAgICB2YXIga2V5ID0gbWF0Y2hVcmxTZWdtZW50KHRoaXMuX3JlbWFpbmluZyk7XG4gICAgaWYgKGlzQmxhbmsoa2V5KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmNhcHR1cmUoa2V5KTtcbiAgICB2YXIgdmFsdWU6IGFueSA9IFwidHJ1ZVwiO1xuICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCc9JykpIHtcbiAgICAgIHRoaXMuY2FwdHVyZSgnPScpO1xuICAgICAgdmFyIHZhbHVlTWF0Y2ggPSBtYXRjaFVybFNlZ21lbnQodGhpcy5fcmVtYWluaW5nKTtcbiAgICAgIGlmIChpc1ByZXNlbnQodmFsdWVNYXRjaCkpIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZU1hdGNoO1xuICAgICAgICB0aGlzLmNhcHR1cmUodmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBhcmFtc1trZXldID0gdmFsdWU7XG4gIH1cblxuICBwYXJzZVF1ZXJ5UGFyYW0ocGFyYW1zOiB7W2tleTogc3RyaW5nXTogYW55fSk6IHZvaWQge1xuICAgIHZhciBrZXkgPSBtYXRjaFVybFNlZ21lbnQodGhpcy5fcmVtYWluaW5nKTtcbiAgICBpZiAoaXNCbGFuayhrZXkpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY2FwdHVyZShrZXkpO1xuICAgIHZhciB2YWx1ZTogYW55ID0gXCJ0cnVlXCI7XG4gICAgaWYgKHRoaXMucGVla1N0YXJ0c1dpdGgoJz0nKSkge1xuICAgICAgdGhpcy5jYXB0dXJlKCc9Jyk7XG4gICAgICB2YXIgdmFsdWVNYXRjaCA9IG1hdGNoVXJsUXVlcnlQYXJhbVZhbHVlKHRoaXMuX3JlbWFpbmluZyk7XG4gICAgICBpZiAoaXNQcmVzZW50KHZhbHVlTWF0Y2gpKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWVNYXRjaDtcbiAgICAgICAgdGhpcy5jYXB0dXJlKHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwYXJhbXNba2V5XSA9IHZhbHVlO1xuICB9XG5cbiAgcGFyc2VBdXhpbGlhcnlSb3V0ZXMoKTogVHJlZU5vZGU8VXJsU2VnbWVudD5bXSB7XG4gICAgdmFyIHNlZ21lbnRzID0gW107XG4gICAgdGhpcy5jYXB0dXJlKCcoJyk7XG5cbiAgICB3aGlsZSAoIXRoaXMucGVla1N0YXJ0c1dpdGgoJyknKSAmJiB0aGlzLl9yZW1haW5pbmcubGVuZ3RoID4gMCkge1xuICAgICAgc2VnbWVudHMgPSBzZWdtZW50cy5jb25jYXQodGhpcy5wYXJzZVNlZ21lbnRzKFwiYXV4XCIpKTtcbiAgICAgIGlmICh0aGlzLnBlZWtTdGFydHNXaXRoKCcvLycpKSB7XG4gICAgICAgIHRoaXMuY2FwdHVyZSgnLy8nKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jYXB0dXJlKCcpJyk7XG5cbiAgICByZXR1cm4gc2VnbWVudHM7XG4gIH1cbn1cbiJdfQ==