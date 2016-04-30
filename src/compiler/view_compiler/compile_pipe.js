'use strict';"use strict";
var lang_1 = require('angular2/src/facade/lang');
var exceptions_1 = require('angular2/src/facade/exceptions');
var o = require('../output/output_ast');
var identifiers_1 = require('../identifiers');
var util_1 = require('./util');
var _PurePipeProxy = (function () {
    function _PurePipeProxy(instance, argCount) {
        this.instance = instance;
        this.argCount = argCount;
    }
    return _PurePipeProxy;
}());
var CompilePipe = (function () {
    function CompilePipe(view, name) {
        this.view = view;
        this._purePipeProxies = [];
        this.meta = _findPipeMeta(view, name);
        this.instance = o.THIS_EXPR.prop("_pipe_" + name + "_" + view.pipeCount++);
    }
    Object.defineProperty(CompilePipe.prototype, "pure", {
        get: function () { return this.meta.pure; },
        enumerable: true,
        configurable: true
    });
    CompilePipe.prototype.create = function () {
        var _this = this;
        var deps = this.meta.type.diDeps.map(function (diDep) {
            if (diDep.token.equalsTo(identifiers_1.identifierToken(identifiers_1.Identifiers.ChangeDetectorRef))) {
                return util_1.getPropertyInView(o.THIS_EXPR.prop('ref'), _this.view, _this.view.componentView);
            }
            return util_1.injectFromViewParentInjector(diDep.token, false);
        });
        this.view.fields.push(new o.ClassField(this.instance.name, o.importType(this.meta.type), [o.StmtModifier.Private]));
        this.view.createMethod.resetDebugInfo(null, null);
        this.view.createMethod.addStmt(o.THIS_EXPR.prop(this.instance.name)
            .set(o.importExpr(this.meta.type).instantiate(deps))
            .toStmt());
        this._purePipeProxies.forEach(function (purePipeProxy) {
            util_1.createPureProxy(_this.instance.prop('transform').callMethod(o.BuiltinMethod.bind, [_this.instance]), purePipeProxy.argCount, purePipeProxy.instance, _this.view);
        });
    };
    CompilePipe.prototype.call = function (callingView, args) {
        if (this.meta.pure) {
            var purePipeProxy = new _PurePipeProxy(o.THIS_EXPR.prop(this.instance.name + "_" + this._purePipeProxies.length), args.length);
            this._purePipeProxies.push(purePipeProxy);
            return util_1.getPropertyInView(o.importExpr(identifiers_1.Identifiers.castByValue)
                .callFn([purePipeProxy.instance, this.instance.prop('transform')]), callingView, this.view)
                .callFn(args);
        }
        else {
            return util_1.getPropertyInView(this.instance, callingView, this.view).callMethod('transform', args);
        }
    };
    return CompilePipe;
}());
exports.CompilePipe = CompilePipe;
function _findPipeMeta(view, name) {
    var pipeMeta = null;
    for (var i = view.pipeMetas.length - 1; i >= 0; i--) {
        var localPipeMeta = view.pipeMetas[i];
        if (localPipeMeta.name == name) {
            pipeMeta = localPipeMeta;
            break;
        }
    }
    if (lang_1.isBlank(pipeMeta)) {
        throw new exceptions_1.BaseException("Illegal state: Could not find pipe " + name + " although the parser should have detected this error!");
    }
    return pipeMeta;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGlsZV9waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGlmZmluZ19wbHVnaW5fd3JhcHBlci1vdXRwdXRfcGF0aC1iT1VqVEczZy50bXAvYW5ndWxhcjIvc3JjL2NvbXBpbGVyL3ZpZXdfY29tcGlsZXIvY29tcGlsZV9waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQkFBaUMsMEJBQTBCLENBQUMsQ0FBQTtBQUM1RCwyQkFBNEIsZ0NBQWdDLENBQUMsQ0FBQTtBQUM3RCxJQUFZLENBQUMsV0FBTSxzQkFBc0IsQ0FBQyxDQUFBO0FBRzFDLDRCQUEyQyxnQkFBZ0IsQ0FBQyxDQUFBO0FBQzVELHFCQUErRSxRQUFRLENBQUMsQ0FBQTtBQUV4RjtJQUNFLHdCQUFtQixRQUF3QixFQUFTLFFBQWdCO1FBQWpELGFBQVEsR0FBUixRQUFRLENBQWdCO1FBQVMsYUFBUSxHQUFSLFFBQVEsQ0FBUTtJQUFHLENBQUM7SUFDMUUscUJBQUM7QUFBRCxDQUFDLEFBRkQsSUFFQztBQUVEO0lBS0UscUJBQW1CLElBQWlCLEVBQUUsSUFBWTtRQUEvQixTQUFJLEdBQUosSUFBSSxDQUFhO1FBRjVCLHFCQUFnQixHQUFxQixFQUFFLENBQUM7UUFHOUMsSUFBSSxDQUFDLElBQUksR0FBRyxhQUFhLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsV0FBUyxJQUFJLFNBQUksSUFBSSxDQUFDLFNBQVMsRUFBSSxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVELHNCQUFJLDZCQUFJO2FBQVIsY0FBc0IsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFFOUMsNEJBQU0sR0FBTjtRQUFBLGlCQWtCQztRQWpCQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FB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VUFBVSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoRyxDQUFDO0lBQ0gsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0FBQyxBQTlDRCxJQThDQztBQTlDWSxtQkFBVyxjQThDdkIsQ0FBQTtBQUdELHVCQUF1QixJQUFpQixFQUFFLElBQVk7SUFDcEQsSUFBSSxRQUFRLEdBQXdCLElBQUksQ0FBQztJQUN6QyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3BELElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEMsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQy9CLFFBQVEsR0FBRyxhQUFhLENBQUM7WUFDekIsS0FBSyxDQUFDO1FBQ1IsQ0FBQztJQUNILENBQUM7SUFDRCxFQUFFLENBQUMsQ0FBQyxjQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sSUFBSSwwQkFBYSxDQUNuQix3Q0FBc0MsSUFBSSwwREFBdUQsQ0FBQyxDQUFDO0lBQ3pHLENBQUM7SUFDRCxNQUFNLENBQUMsUUFBUSxDQUFDO0FBQ2xCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2lzQmxhbmssIGlzUHJlc2VudH0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcbmltcG9ydCB7QmFzZUV4Y2VwdGlvbn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9leGNlcHRpb25zJztcbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtDb21waWxlVmlld30gZnJvbSAnLi9jb21waWxlX3ZpZXcnO1xuaW1wb3J0IHtDb21waWxlUGlwZU1ldGFkYXRhfSBmcm9tICcuLi9jb21waWxlX21ldGFkYXRhJztcbmltcG9ydCB7SWRlbnRpZmllcnMsIGlkZW50aWZpZXJUb2tlbn0gZnJvbSAnLi4vaWRlbnRpZmllcnMnO1xuaW1wb3J0IHtpbmplY3RGcm9tVmlld1BhcmVudEluamVjdG9yLCBjcmVhdGVQdXJlUHJveHksIGdldFByb3BlcnR5SW5WaWV3fSBmcm9tICcuL3V0aWwnO1xuXG5jbGFzcyBfUHVyZVBpcGVQcm94eSB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBpbnN0YW5jZTogby5SZWFkUHJvcEV4cHIsIHB1YmxpYyBhcmdDb3VudDogbnVtYmVyKSB7fVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcGlsZVBpcGUge1xuICBtZXRhOiBDb21waWxlUGlwZU1ldGFkYXRhO1xuICBpbnN0YW5jZTogby5SZWFkUHJvcEV4cHI7XG4gIHByaXZhdGUgX3B1cmVQaXBlUHJveGllczogX1B1cmVQaXBlUHJveHlbXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyB2aWV3OiBDb21waWxlVmlldywgbmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5tZXRhID0gX2ZpbmRQaXBlTWV0YSh2aWV3LCBuYW1lKTtcbiAgICB0aGlzLmluc3RhbmNlID0gby5USElTX0VYUFIucHJvcChgX3BpcGVfJHtuYW1lfV8ke3ZpZXcucGlwZUNvdW50Kyt9YCk7XG4gIH1cblxuICBnZXQgcHVyZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMubWV0YS5wdXJlOyB9XG5cbiAgY3JlYXRlKCk6IHZvaWQge1xuICAgIHZhciBkZXBzID0gdGhpcy5tZXRhLnR5cGUuZGlEZXBzLm1hcCgoZGlEZXApID0+IHtcbiAgICAgIGlmIChkaURlcC50b2tlbi5lcXVhbHNUbyhpZGVudGlmaWVyVG9rZW4oSWRlbnRpZmllcnMuQ2hhbmdlRGV0ZWN0b3JSZWYpKSkge1xuICAgICAgICByZXR1cm4gZ2V0UHJvcGVydHlJblZpZXcoby5USElTX0VYUFIucHJvcCgncmVmJyksIHRoaXMudmlldywgdGhpcy52aWV3LmNvbXBvbmVudFZpZXcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGluamVjdEZyb21WaWV3UGFyZW50SW5qZWN0b3IoZGlEZXAudG9rZW4sIGZhbHNlKTtcbiAgICB9KTtcbiAgICB0aGlzLnZpZXcuZmllbGRzLnB1c2gobmV3IG8uQ2xhc3NGaWVsZCh0aGlzLmluc3RhbmNlLm5hbWUsIG8uaW1wb3J0VHlwZSh0aGlzLm1ldGEudHlwZSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW28uU3RtdE1vZGlmaWVyLlByaXZhdGVdKSk7XG4gICAgdGhpcy52aWV3LmNyZWF0ZU1ldGhvZC5yZXNldERlYnVnSW5mbyhudWxsLCBudWxsKTtcbiAgICB0aGlzLnZpZXcuY3JlYXRlTWV0aG9kLmFkZFN0bXQoby5USElTX0VYUFIucHJvcCh0aGlzLmluc3RhbmNlLm5hbWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0KG8uaW1wb3J0RXhwcih0aGlzLm1ldGEudHlwZSkuaW5zdGFudGlhdGUoZGVwcykpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG9TdG10KCkpO1xuICAgIHRoaXMuX3B1cmVQaXBlUHJveGllcy5mb3JFYWNoKChwdXJlUGlwZVByb3h5KSA9PiB7XG4gICAgICBjcmVhdGVQdXJlUHJveHkoXG4gICAgICAgICAgdGhpcy5pbnN0YW5jZS5wcm9wKCd0cmFuc2Zvcm0nKS5jYWxsTWV0aG9kKG8uQnVpbHRpbk1ldGhvZC5iaW5kLCBbdGhpcy5pbnN0YW5jZV0pLFxuICAgICAgICAgIHB1cmVQaXBlUHJveHkuYXJnQ291bnQsIHB1cmVQaXBlUHJveHkuaW5zdGFuY2UsIHRoaXMudmlldyk7XG4gICAgfSk7XG4gIH1cblxuICBjYWxsKGNhbGxpbmdWaWV3OiBDb21waWxlVmlldywgYXJnczogby5FeHByZXNzaW9uW10pOiBvLkV4cHJlc3Npb24ge1xuICAgIGlmICh0aGlzLm1ldGEucHVyZSkge1xuICAgICAgdmFyIHB1cmVQaXBlUHJveHkgPSBuZXcgX1B1cmVQaXBlUHJveHkoXG4gICAgICAgICAgby5USElTX0VYUFIucHJvcChgJHt0aGlzLmluc3RhbmNlLm5hbWV9XyR7dGhpcy5fcHVyZVBpcGVQcm94aWVzLmxlbmd0aH1gKSwgYXJncy5sZW5ndGgpO1xuICAgICAgdGhpcy5fcHVyZVBpcGVQcm94aWVzLnB1c2gocHVyZVBpcGVQcm94eSk7XG4gICAgICByZXR1cm4gZ2V0UHJvcGVydHlJblZpZXcoXG4gICAgICAgICAgICAgICAgIG8uaW1wb3J0RXhwcihJZGVudGlmaWVycy5jYXN0QnlWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgIC5jYWxsRm4oW3B1cmVQaXBlUHJveHkuaW5zdGFuY2UsIHRoaXMuaW5zdGFuY2UucHJvcCgndHJhbnNmb3JtJyldKSxcbiAgICAgICAgICAgICAgICAgY2FsbGluZ1ZpZXcsIHRoaXMudmlldylcbiAgICAgICAgICAuY2FsbEZuKGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZ2V0UHJvcGVydHlJblZpZXcodGhpcy5pbnN0YW5jZSwgY2FsbGluZ1ZpZXcsIHRoaXMudmlldykuY2FsbE1ldGhvZCgndHJhbnNmb3JtJywgYXJncyk7XG4gICAgfVxuICB9XG59XG5cblxuZnVuY3Rpb24gX2ZpbmRQaXBlTWV0YSh2aWV3OiBDb21waWxlVmlldywgbmFtZTogc3RyaW5nKTogQ29tcGlsZVBpcGVNZXRhZGF0YSB7XG4gIHZhciBwaXBlTWV0YTogQ29tcGlsZVBpcGVNZXRhZGF0YSA9IG51bGw7XG4gIGZvciAodmFyIGkgPSB2aWV3LnBpcGVNZXRhcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsb2NhbFBpcGVNZXRhID0gdmlldy5waXBlTWV0YXNbaV07XG4gICAgaWYgKGxvY2FsUGlwZU1ldGEubmFtZSA9PSBuYW1lKSB7XG4gICAgICBwaXBlTWV0YSA9IGxvY2FsUGlwZU1ldGE7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgaWYgKGlzQmxhbmsocGlwZU1ldGEpKSB7XG4gICAgdGhyb3cgbmV3IEJhc2VFeGNlcHRpb24oXG4gICAgICAgIGBJbGxlZ2FsIHN0YXRlOiBDb3VsZCBub3QgZmluZCBwaXBlICR7bmFtZX0gYWx0aG91Z2ggdGhlIHBhcnNlciBzaG91bGQgaGF2ZSBkZXRlY3RlZCB0aGlzIGVycm9yIWApO1xuICB9XG4gIHJldHVybiBwaXBlTWV0YTtcbn1cbiJdfQ==