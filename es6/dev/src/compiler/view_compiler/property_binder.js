import * as o from '../output/output_ast';
import { Identifiers } from '../identifiers';
import { DetectChangesVars } from './constants';
import { PropertyBindingType } from '../template_ast';
import { isBlank, isPresent } from 'angular2/src/facade/lang';
import { LifecycleHooks } from 'angular2/src/core/metadata/lifecycle_hooks';
import { isDefaultChangeDetectionStrategy } from 'angular2/src/core/change_detection/constants';
import { camelCaseToDashCase } from '../util';
import { convertCdExpressionToIr } from './expression_converter';
import { CompileBinding } from './compile_binding';
function createBindFieldExpr(exprIndex) {
    return o.THIS_EXPR.prop(`_expr_${exprIndex}`);
}
function createCurrValueExpr(exprIndex) {
    return o.variable(`currVal_${exprIndex}`);
}
function bind(view, currValExpr, fieldExpr, parsedExpression, context, actions, method) {
    var checkExpression = convertCdExpressionToIr(view, context, parsedExpression, DetectChangesVars.valUnwrapper);
    if (isBlank(checkExpression.expression)) {
        // e.g. an empty expression was given
        return;
    }
    view.fields.push(new o.ClassField(fieldExpr.name, null, [o.StmtModifier.Private]));
    view.createMethod.addStmt(o.THIS_EXPR.prop(fieldExpr.name).set(o.importExpr(Identifiers.uninitialized)).toStmt());
    if (checkExpression.needsValueUnwrapper) {
        var initValueUnwrapperStmt = DetectChangesVars.valUnwrapper.callMethod('reset', []).toStmt();
        method.addStmt(initValueUnwrapperStmt);
    }
    method.addStmt(currValExpr.set(checkExpression.expression).toDeclStmt(null, [o.StmtModifier.Final]));
    var condition = o.importExpr(Identifiers.checkBinding)
        .callFn([DetectChangesVars.throwOnChange, fieldExpr, currValExpr]);
    if (checkExpression.needsValueUnwrapper) {
        condition = DetectChangesVars.valUnwrapper.prop('hasWrappedValue').or(condition);
    }
    method.addStmt(new o.IfStmt(condition, actions.concat([o.THIS_EXPR.prop(fieldExpr.name).set(currValExpr).toStmt()])));
}
export function bindRenderText(boundText, compileNode, view) {
    var bindingIndex = view.bindings.length;
    view.bindings.push(new CompileBinding(compileNode, boundText));
    var currValExpr = createCurrValueExpr(bindingIndex);
    var valueField = createBindFieldExpr(bindingIndex);
    view.detectChangesRenderPropertiesMethod.resetDebugInfo(compileNode.nodeIndex, boundText);
    bind(view, currValExpr, valueField, boundText.value, view.componentContext, [
        o.THIS_EXPR.prop('renderer')
            .callMethod('setText', [compileNode.renderNode, currValExpr])
            .toStmt()
    ], view.detectChangesRenderPropertiesMethod);
}
function bindAndWriteToRenderer(boundProps, context, compileElement) {
    var view = compileElement.view;
    var renderNode = compileElement.renderNode;
    boundProps.forEach((boundProp) => {
        var bindingIndex = view.bindings.length;
        view.bindings.push(new CompileBinding(compileElement, boundProp));
        view.detectChangesRenderPropertiesMethod.resetDebugInfo(compileElement.nodeIndex, boundProp);
        var fieldExpr = createBindFieldExpr(bindingIndex);
        var currValExpr = createCurrValueExpr(bindingIndex);
        var renderMethod;
        var renderValue = currValExpr;
        var updateStmts = [];
        switch (boundProp.type) {
            case PropertyBindingType.Property:
                renderMethod = 'setElementProperty';
                if (view.genConfig.logBindingUpdate) {
                    updateStmts.push(logBindingUpdateStmt(renderNode, boundProp.name, currValExpr));
                }
                break;
            case PropertyBindingType.Attribute:
                renderMethod = 'setElementAttribute';
                renderValue =
                    renderValue.isBlank().conditional(o.NULL_EXPR, renderValue.callMethod('toString', []));
                break;
            case PropertyBindingType.Class:
                renderMethod = 'setElementClass';
                break;
            case PropertyBindingType.Style:
                renderMethod = 'setElementStyle';
                var strValue = renderValue.callMethod('toString', []);
                if (isPresent(boundProp.unit)) {
                    strValue = strValue.plus(o.literal(boundProp.unit));
                }
                renderValue = renderValue.isBlank().conditional(o.NULL_EXPR, strValue);
                break;
        }
        updateStmts.push(o.THIS_EXPR.prop('renderer')
            .callMethod(renderMethod, [renderNode, o.literal(boundProp.name), renderValue])
            .toStmt());
        bind(view, currValExpr, fieldExpr, boundProp.value, context, updateStmts, view.detectChangesRenderPropertiesMethod);
    });
}
export function bindRenderInputs(boundProps, compileElement) {
    bindAndWriteToRenderer(boundProps, compileElement.view.componentContext, compileElement);
}
export function bindDirectiveHostProps(directiveAst, directiveInstance, compileElement) {
    bindAndWriteToRenderer(directiveAst.hostProperties, directiveInstance, compileElement);
}
export function bindDirectiveInputs(directiveAst, directiveInstance, compileElement) {
    if (directiveAst.inputs.length === 0) {
        return;
    }
    var view = compileElement.view;
    var detectChangesInInputsMethod = view.detectChangesInInputsMethod;
    detectChangesInInputsMethod.resetDebugInfo(compileElement.nodeIndex, compileElement.sourceAst);
    var lifecycleHooks = directiveAst.directive.lifecycleHooks;
    var calcChangesMap = lifecycleHooks.indexOf(LifecycleHooks.OnChanges) !== -1;
    var isOnPushComp = directiveAst.directive.isComponent &&
        !isDefaultChangeDetectionStrategy(directiveAst.directive.changeDetection);
    if (calcChangesMap) {
        detectChangesInInputsMethod.addStmt(DetectChangesVars.changes.set(o.NULL_EXPR).toStmt());
    }
    if (isOnPushComp) {
        detectChangesInInputsMethod.addStmt(DetectChangesVars.changed.set(o.literal(false)).toStmt());
    }
    directiveAst.inputs.forEach((input) => {
        var bindingIndex = view.bindings.length;
        view.bindings.push(new CompileBinding(compileElement, input));
        detectChangesInInputsMethod.resetDebugInfo(compileElement.nodeIndex, input);
        var fieldExpr = createBindFieldExpr(bindingIndex);
        var currValExpr = createCurrValueExpr(bindingIndex);
        var statements = [directiveInstance.prop(input.directiveName).set(currValExpr).toStmt()];
        if (calcChangesMap) {
            statements.push(new o.IfStmt(DetectChangesVars.changes.identical(o.NULL_EXPR), [
                DetectChangesVars.changes.set(o.literalMap([], new o.MapType(o.importType(Identifiers.SimpleChange))))
                    .toStmt()
            ]));
            statements.push(DetectChangesVars.changes.key(o.literal(input.directiveName))
                .set(o.importExpr(Identifiers.SimpleChange).instantiate([fieldExpr, currValExpr]))
                .toStmt());
        }
        if (isOnPushComp) {
            statements.push(DetectChangesVars.changed.set(o.literal(true)).toStmt());
        }
        if (view.genConfig.logBindingUpdate) {
            statements.push(logBindingUpdateStmt(compileElement.renderNode, input.directiveName, currValExpr));
        }
        bind(view, currValExpr, fieldExpr, input.value, view.componentContext, statements, detectChangesInInputsMethod);
    });
    if (isOnPushComp) {
        detectChangesInInputsMethod.addStmt(new o.IfStmt(DetectChangesVars.changed, [
            compileElement.appElement.prop('componentView')
                .callMethod('markAsCheckOnce', [])
                .toStmt()
        ]));
    }
}
function logBindingUpdateStmt(renderNode, propName, value) {
    return o.THIS_EXPR.prop('renderer')
        .callMethod('setBindingDebugInfo', [
        renderNode,
        o.literal(`ng-reflect-${camelCaseToDashCase(propName)}`),
        value.isBlank().conditional(o.NULL_EXPR, value.callMethod('toString', []))
    ])
        .toStmt();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvcGVydHlfYmluZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGlmZmluZ19wbHVnaW5fd3JhcHBlci1vdXRwdXRfcGF0aC03ZDJwU2NubS50bXAvYW5ndWxhcjIvc3JjL2NvbXBpbGVyL3ZpZXdfY29tcGlsZXIvcHJvcGVydHlfYmluZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJPQUNPLEtBQUssQ0FBQyxNQUFNLHNCQUFzQjtPQUNsQyxFQUFDLFdBQVcsRUFBQyxNQUFNLGdCQUFnQjtPQUNuQyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sYUFBYTtPQUV0QyxFQUlMLG1CQUFtQixFQUVwQixNQUFNLGlCQUFpQjtPQUVqQixFQUFDLE9BQU8sRUFBRSxTQUFTLEVBQXNCLE1BQU0sMEJBQTBCO09BTXpFLEVBQUMsY0FBYyxFQUFDLE1BQU0sNENBQTRDO09BQ2xFLEVBQUMsZ0NBQWdDLEVBQUMsTUFBTSw4Q0FBOEM7T0FDdEYsRUFBQyxtQkFBbUIsRUFBQyxNQUFNLFNBQVM7T0FFcEMsRUFBQyx1QkFBdUIsRUFBQyxNQUFNLHdCQUF3QjtPQUV2RCxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQjtBQUVoRCw2QkFBNkIsU0FBaUI7SUFDNUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsU0FBUyxFQUFFLENBQUMsQ0FBQztBQUNoRCxDQUFDO0FBRUQsNkJBQTZCLFNBQWlCO0lBQzVDLE1BQU0sQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsU0FBUyxFQUFFLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsY0FBYyxJQUFpQixFQUFFLFdBQTBCLEVBQUUsU0FBeUIsRUFDeEUsZ0JBQTJCLEVBQUUsT0FBcUIsRUFBRSxPQUFzQixFQUMxRSxNQUFxQjtJQUNqQyxJQUFJLGVBQWUsR0FDZix1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixDQUFDLFlBQVksQ0FB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O0lBQ3BDLENBQUMsQ0FBQyxDQUFDO0lBQ0gsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztRQUNqQiwyQkFBMkIsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRTtZQUMxRSxjQUFjLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7aUJBQzFDLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQUM7aUJBQ2pDLE1BQU0sRUFBRTtTQUNkLENBQUMsQ0FBQyxDQUFDO0lBQ04sQ0FBQztBQUNILENBQUM7QUFFRCw4QkFBOEIsVUFBd0IsRUFBRSxRQUFnQixFQUMxQyxLQUFtQjtJQUMvQyxNQUFNLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1NBQzlCLFVBQVUsQ0FBQyxxQkFBcUIsRUFDckI7UUFDRSxVQUFVO1FBQ1YsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDeEQsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0tBQzNFLENBQUM7U0FDYixNQUFNLEVBQUUsQ0FBQztBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RBc3QgZnJvbSAnLi4vZXhwcmVzc2lvbl9wYXJzZXIvYXN0JztcbmltcG9ydCAqIGFzIG8gZnJvbSAnLi4vb3V0cHV0L291dHB1dF9hc3QnO1xuaW1wb3J0IHtJZGVudGlmaWVyc30gZnJvbSAnLi4vaWRlbnRpZmllcnMnO1xuaW1wb3J0IHtEZXRlY3RDaGFuZ2VzVmFyc30gZnJvbSAnLi9jb25zdGFudHMnO1xuXG5pbXBvcnQge1xuICBCb3VuZFRleHRBc3QsXG4gIEJvdW5kRWxlbWVudFByb3BlcnR5QXN0LFxuICBEaXJlY3RpdmVBc3QsXG4gIFByb3BlcnR5QmluZGluZ1R5cGUsXG4gIFRlbXBsYXRlQXN0XG59IGZyb20gJy4uL3RlbXBsYXRlX2FzdCc7XG5cbmltcG9ydCB7aXNCbGFuaywgaXNQcmVzZW50LCBpc0FycmF5LCBDT05TVF9FWFBSfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2xhbmcnO1xuXG5pbXBvcnQge0NvbXBpbGVWaWV3fSBmcm9tICcuL2NvbXBpbGVfdmlldyc7XG5pbXBvcnQge0NvbXBpbGVFbGVtZW50LCBDb21waWxlTm9kZX0gZnJvbSAnLi9jb21waWxlX2VsZW1lbnQnO1xuaW1wb3J0IHtDb21waWxlTWV0aG9kfSBmcm9tICcuL2NvbXBpbGVfbWV0aG9kJztcblxuaW1wb3J0IHtMaWZlY3ljbGVIb29rc30gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvbWV0YWRhdGEvbGlmZWN5Y2xlX2hvb2tzJztcbmltcG9ydCB7aXNEZWZhdWx0Q2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3l9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2NoYW5nZV9kZXRlY3Rpb24vY29uc3RhbnRzJztcbmltcG9ydCB7Y2FtZWxDYXNlVG9EYXNoQ2FzZX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7Y29udmVydENkRXhwcmVzc2lvblRvSXJ9IGZyb20gJy4vZXhwcmVzc2lvbl9jb252ZXJ0ZXInO1xuXG5pbXBvcnQge0NvbXBpbGVCaW5kaW5nfSBmcm9tICcuL2NvbXBpbGVfYmluZGluZyc7XG5cbmZ1bmN0aW9uIGNyZWF0ZUJpbmRGaWVsZEV4cHIoZXhwckluZGV4OiBudW1iZXIpOiBvLlJlYWRQcm9wRXhwciB7XG4gIHJldHVybiBvLlRISVNfRVhQUi5wcm9wKGBfZXhwcl8ke2V4cHJJbmRleH1gKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQ3VyclZhbHVlRXhwcihleHBySW5kZXg6IG51bWJlcik6IG8uUmVhZFZhckV4cHIge1xuICByZXR1cm4gby52YXJpYWJsZShgY3VyclZhbF8ke2V4cHJJbmRleH1gKTtcbn1cblxuZnVuY3Rpb24gYmluZCh2aWV3OiBDb21waWxlVmlldywgY3VyclZhbEV4cHI6IG8uUmVhZFZhckV4cHIsIGZpZWxkRXhwcjogby5SZWFkUHJvcEV4cHIsXG4gICAgICAgICAgICAgIHBhcnNlZEV4cHJlc3Npb246IGNkQXN0LkFTVCwgY29udGV4dDogby5FeHByZXNzaW9uLCBhY3Rpb25zOiBvLlN0YXRlbWVudFtdLFxuICAgICAgICAgICAgICBtZXRob2Q6IENvbXBpbGVNZXRob2QpIHtcbiAgdmFyIGNoZWNrRXhwcmVzc2lvbiA9XG4gICAgICBjb252ZXJ0Q2RFeHByZXNzaW9uVG9Jcih2aWV3LCBjb250ZXh0LCBwYXJzZWRFeHByZXNzaW9uLCBEZXRlY3RDaGFuZ2VzVmFycy52YWxVbndyYXBwZXIpO1xuICBpZiAoaXNCbGFuayhjaGVja0V4cHJlc3Npb24uZXhwcmVzc2lvbikpIHtcbiAgICAvLyBlLmcuIGFuIGVtcHR5IGV4cHJlc3Npb24gd2FzIGdpdmVuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmlldy5maWVsZHMucHVzaChuZXcgby5DbGFzc0ZpZWxkKGZpZWxkRXhwci5uYW1lLCBudWxsLCBbby5TdG10TW9kaWZpZXIuUHJpdmF0ZV0pKTtcbiAgdmlldy5jcmVhdGVNZXRob2QuYWRkU3RtdChcbiAgICAgIG8uVEhJU19FWFBSLnByb3AoZmllbGRFeHByLm5hbWUpLnNldChvLmltcG9ydEV4cHIoSWRlbnRpZmllcnMudW5pbml0aWFsaXplZCkpLnRvU3RtdCgpKTtcblxuICBpZiAoY2hlY2tFeHByZXNzaW9uLm5lZWRzVmFsdWVVbndyYXBwZXIpIHtcbiAgICB2YXIgaW5pdFZhbHVlVW53cmFwcGVyU3RtdCA9IERldGVjdENoYW5nZXNWYXJzLnZhbFVud3JhcHBlci5jYWxsTWV0aG9kKCdyZXNldCcsIFtdKS50b1N0bXQoKTtcbiAgICBtZXRob2QuYWRkU3RtdChpbml0VmFsdWVVbndyYXBwZXJTdG10KTtcbiAgfVxuICBtZXRob2QuYWRkU3RtdChcbiAgICAgIGN1cnJWYWxFeHByLnNldChjaGVja0V4cHJlc3Npb24uZXhwcmVzc2lvbikudG9EZWNsU3RtdChudWxsLCBbby5TdG10TW9kaWZpZXIuRmluYWxdKSk7XG5cbiAgdmFyIGNvbmRpdGlvbjogby5FeHByZXNzaW9uID1cbiAgICAgIG8uaW1wb3J0RXhwcihJZGVudGlmaWVycy5jaGVja0JpbmRpbmcpXG4gICAgICAgICAgLmNhbGxGbihbRGV0ZWN0Q2hhbmdlc1ZhcnMudGhyb3dPbkNoYW5nZSwgZmllbGRFeHByLCBjdXJyVmFsRXhwcl0pO1xuICBpZiAoY2hlY2tFeHByZXNzaW9uLm5lZWRzVmFsdWVVbndyYXBwZXIpIHtcbiAgICBjb25kaXRpb24gPSBEZXRlY3RDaGFuZ2VzVmFycy52YWxVbndyYXBwZXIucHJvcCgnaGFzV3JhcHBlZFZhbHVlJykub3IoY29uZGl0aW9uKTtcbiAgfVxuICBtZXRob2QuYWRkU3RtdChuZXcgby5JZlN0bXQoXG4gICAgICBjb25kaXRpb24sXG4gICAgICBhY3Rpb25zLmNvbmNhdChbPG8uU3RhdGVtZW50Pm8uVEhJU19FWFBSLnByb3AoZmllbGRFeHByLm5hbWUpLnNldChjdXJyVmFsRXhwcikudG9TdG10KCldKSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmluZFJlbmRlclRleHQoYm91bmRUZXh0OiBCb3VuZFRleHRBc3QsIGNvbXBpbGVOb2RlOiBDb21waWxlTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3OiBDb21waWxlVmlldykge1xuICB2YXIgYmluZGluZ0luZGV4ID0gdmlldy5iaW5kaW5ncy5sZW5ndGg7XG4gIHZpZXcuYmluZGluZ3MucHVzaChuZXcgQ29tcGlsZUJpbmRpbmcoY29tcGlsZU5vZGUsIGJvdW5kVGV4dCkpO1xuICB2YXIgY3VyclZhbEV4cHIgPSBjcmVhdGVDdXJyVmFsdWVFeHByKGJpbmRpbmdJbmRleCk7XG4gIHZhciB2YWx1ZUZpZWxkID0gY3JlYXRlQmluZEZpZWxkRXhwcihiaW5kaW5nSW5kZXgpO1xuICB2aWV3LmRldGVjdENoYW5nZXNSZW5kZXJQcm9wZXJ0aWVzTWV0aG9kLnJlc2V0RGVidWdJbmZvKGNvbXBpbGVOb2RlLm5vZGVJbmRleCwgYm91bmRUZXh0KTtcblxuICBiaW5kKHZpZXcsIGN1cnJWYWxFeHByLCB2YWx1ZUZpZWxkLCBib3VuZFRleHQudmFsdWUsIHZpZXcuY29tcG9uZW50Q29udGV4dCxcbiAgICAgICBbXG4gICAgICAgICBvLlRISVNfRVhQUi5wcm9wKCdyZW5kZXJlcicpXG4gICAgICAgICAgICAgLmNhbGxNZXRob2QoJ3NldFRleHQnLCBbY29tcGlsZU5vZGUucmVuZGVyTm9kZSwgY3VyclZhbEV4cHJdKVxuICAgICAgICAgICAgIC50b1N0bXQoKVxuICAgICAgIF0sXG4gICAgICAgdmlldy5kZXRlY3RDaGFuZ2VzUmVuZGVyUHJvcGVydGllc01ldGhvZCk7XG59XG5cbmZ1bmN0aW9uIGJpbmRBbmRXcml0ZVRvUmVuZGVyZXIoYm91bmRQcm9wczogQm91bmRFbGVtZW50UHJvcGVydHlBc3RbXSwgY29udGV4dDogby5FeHByZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21waWxlRWxlbWVudDogQ29tcGlsZUVsZW1lbnQpIHtcbiAgdmFyIHZpZXcgPSBjb21waWxlRWxlbWVudC52aWV3O1xuICB2YXIgcmVuZGVyTm9kZSA9IGNvbXBpbGVFbGVtZW50LnJlbmRlck5vZGU7XG4gIGJvdW5kUHJvcHMuZm9yRWFjaCgoYm91bmRQcm9wKSA9PiB7XG4gICAgdmFyIGJpbmRpbmdJbmRleCA9IHZpZXcuYmluZGluZ3MubGVuZ3RoO1xuICAgIHZpZXcuYmluZGluZ3MucHVzaChuZXcgQ29tcGlsZUJpbmRpbmcoY29tcGlsZUVsZW1lbnQsIGJvdW5kUHJvcCkpO1xuICAgIHZpZXcuZGV0ZWN0Q2hhbmdlc1JlbmRlclByb3BlcnRpZXNNZXRob2QucmVzZXREZWJ1Z0luZm8oY29tcGlsZUVsZW1lbnQubm9kZUluZGV4LCBib3VuZFByb3ApO1xuICAgIHZhciBmaWVsZEV4cHIgPSBjcmVhdGVCaW5kRmllbGRFeHByKGJpbmRpbmdJbmRleCk7XG4gICAgdmFyIGN1cnJWYWxFeHByID0gY3JlYXRlQ3VyclZhbHVlRXhwcihiaW5kaW5nSW5kZXgpO1xuICAgIHZhciByZW5kZXJNZXRob2Q6IHN0cmluZztcbiAgICB2YXIgcmVuZGVyVmFsdWU6IG8uRXhwcmVzc2lvbiA9IGN1cnJWYWxFeHByO1xuICAgIHZhciB1cGRhdGVTdG10cyA9IFtdO1xuICAgIHN3aXRjaCAoYm91bmRQcm9wLnR5cGUpIHtcbiAgICAgIGNhc2UgUHJvcGVydHlCaW5kaW5nVHlwZS5Qcm9wZXJ0eTpcbiAgICAgICAgcmVuZGVyTWV0aG9kID0gJ3NldEVsZW1lbnRQcm9wZXJ0eSc7XG4gICAgICAgIGlmICh2aWV3LmdlbkNvbmZpZy5sb2dCaW5kaW5nVXBkYXRlKSB7XG4gICAgICAgICAgdXBkYXRlU3RtdHMucHVzaChsb2dCaW5kaW5nVXBkYXRlU3RtdChyZW5kZXJOb2RlLCBib3VuZFByb3AubmFtZSwgY3VyclZhbEV4cHIpKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgUHJvcGVydHlCaW5kaW5nVHlwZS5BdHRyaWJ1dGU6XG4gICAgICAgIHJlbmRlck1ldGhvZCA9ICdzZXRFbGVtZW50QXR0cmlidXRlJztcbiAgICAgICAgcmVuZGVyVmFsdWUgPVxuICAgICAgICAgICAgcmVuZGVyVmFsdWUuaXNCbGFuaygpLmNvbmRpdGlvbmFsKG8uTlVMTF9FWFBSLCByZW5kZXJWYWx1ZS5jYWxsTWV0aG9kKCd0b1N0cmluZycsIFtdKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQcm9wZXJ0eUJpbmRpbmdUeXBlLkNsYXNzOlxuICAgICAgICByZW5kZXJNZXRob2QgPSAnc2V0RWxlbWVudENsYXNzJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFByb3BlcnR5QmluZGluZ1R5cGUuU3R5bGU6XG4gICAgICAgIHJlbmRlck1ldGhvZCA9ICdzZXRFbGVtZW50U3R5bGUnO1xuICAgICAgICB2YXIgc3RyVmFsdWU6IG8uRXhwcmVzc2lvbiA9IHJlbmRlclZhbHVlLmNhbGxNZXRob2QoJ3RvU3RyaW5nJywgW10pO1xuICAgICAgICBpZiAoaXNQcmVzZW50KGJvdW5kUHJvcC51bml0KSkge1xuICAgICAgICAgIHN0clZhbHVlID0gc3RyVmFsdWUucGx1cyhvLmxpdGVyYWwoYm91bmRQcm9wLnVuaXQpKTtcbiAgICAgICAgfVxuICAgICAgICByZW5kZXJWYWx1ZSA9IHJlbmRlclZhbHVlLmlzQmxhbmsoKS5jb25kaXRpb25hbChvLk5VTExfRVhQUiwgc3RyVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgdXBkYXRlU3RtdHMucHVzaChcbiAgICAgICAgby5USElTX0VYUFIucHJvcCgncmVuZGVyZXInKVxuICAgICAgICAgICAgLmNhbGxNZXRob2QocmVuZGVyTWV0aG9kLCBbcmVuZGVyTm9kZSwgby5saXRlcmFsKGJvdW5kUHJvcC5uYW1lKSwgcmVuZGVyVmFsdWVdKVxuICAgICAgICAgICAgLnRvU3RtdCgpKTtcblxuICAgIGJpbmQodmlldywgY3VyclZhbEV4cHIsIGZpZWxkRXhwciwgYm91bmRQcm9wLnZhbHVlLCBjb250ZXh0LCB1cGRhdGVTdG10cyxcbiAgICAgICAgIHZpZXcuZGV0ZWN0Q2hhbmdlc1JlbmRlclByb3BlcnRpZXNNZXRob2QpO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJpbmRSZW5kZXJJbnB1dHMoYm91bmRQcm9wczogQm91bmRFbGVtZW50UHJvcGVydHlBc3RbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBpbGVFbGVtZW50OiBDb21waWxlRWxlbWVudCk6IHZvaWQge1xuICBiaW5kQW5kV3JpdGVUb1JlbmRlcmVyKGJvdW5kUHJvcHMsIGNvbXBpbGVFbGVtZW50LnZpZXcuY29tcG9uZW50Q29udGV4dCwgY29tcGlsZUVsZW1lbnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmluZERpcmVjdGl2ZUhvc3RQcm9wcyhkaXJlY3RpdmVBc3Q6IERpcmVjdGl2ZUFzdCwgZGlyZWN0aXZlSW5zdGFuY2U6IG8uRXhwcmVzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBpbGVFbGVtZW50OiBDb21waWxlRWxlbWVudCk6IHZvaWQge1xuICBiaW5kQW5kV3JpdGVUb1JlbmRlcmVyKGRpcmVjdGl2ZUFzdC5ob3N0UHJvcGVydGllcywgZGlyZWN0aXZlSW5zdGFuY2UsIGNvbXBpbGVFbGVtZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJpbmREaXJlY3RpdmVJbnB1dHMoZGlyZWN0aXZlQXN0OiBEaXJlY3RpdmVBc3QsIGRpcmVjdGl2ZUluc3RhbmNlOiBvLkV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21waWxlRWxlbWVudDogQ29tcGlsZUVsZW1lbnQpIHtcbiAgaWYgKGRpcmVjdGl2ZUFzdC5pbnB1dHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciB2aWV3ID0gY29tcGlsZUVsZW1lbnQudmlldztcbiAgdmFyIGRldGVjdENoYW5nZXNJbklucHV0c01ldGhvZCA9IHZpZXcuZGV0ZWN0Q2hhbmdlc0luSW5wdXRzTWV0aG9kO1xuICBkZXRlY3RDaGFuZ2VzSW5JbnB1dHNNZXRob2QucmVzZXREZWJ1Z0luZm8oY29tcGlsZUVsZW1lbnQubm9kZUluZGV4LCBjb21waWxlRWxlbWVudC5zb3VyY2VBc3QpO1xuXG4gIHZhciBsaWZlY3ljbGVIb29rcyA9IGRpcmVjdGl2ZUFzdC5kaXJlY3RpdmUubGlmZWN5Y2xlSG9va3M7XG4gIHZhciBjYWxjQ2hhbmdlc01hcCA9IGxpZmVjeWNsZUhvb2tzLmluZGV4T2YoTGlmZWN5Y2xlSG9va3MuT25DaGFuZ2VzKSAhPT0gLTE7XG4gIHZhciBpc09uUHVzaENvbXAgPSBkaXJlY3RpdmVBc3QuZGlyZWN0aXZlLmlzQ29tcG9uZW50ICYmXG4gICAgICAgICAgICAgICAgICAgICAhaXNEZWZhdWx0Q2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3koZGlyZWN0aXZlQXN0LmRpcmVjdGl2ZS5jaGFuZ2VEZXRlY3Rpb24pO1xuICBpZiAoY2FsY0NoYW5nZXNNYXApIHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5JbnB1dHNNZXRob2QuYWRkU3RtdChEZXRlY3RDaGFuZ2VzVmFycy5jaGFuZ2VzLnNldChvLk5VTExfRVhQUikudG9TdG10KCkpO1xuICB9XG4gIGlmIChpc09uUHVzaENvbXApIHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5JbnB1dHNNZXRob2QuYWRkU3RtdChEZXRlY3RDaGFuZ2VzVmFycy5jaGFuZ2VkLnNldChvLmxpdGVyYWwoZmFsc2UpKS50b1N0bXQoKSk7XG4gIH1cbiAgZGlyZWN0aXZlQXN0LmlucHV0cy5mb3JFYWNoKChpbnB1dCkgPT4ge1xuICAgIHZhciBiaW5kaW5nSW5kZXggPSB2aWV3LmJpbmRpbmdzLmxlbmd0aDtcbiAgICB2aWV3LmJpbmRpbmdzLnB1c2gobmV3IENvbXBpbGVCaW5kaW5nKGNvbXBpbGVFbGVtZW50LCBpbnB1dCkpO1xuICAgIGRldGVjdENoYW5nZXNJbklucHV0c01ldGhvZC5yZXNldERlYnVnSW5mbyhjb21waWxlRWxlbWVudC5ub2RlSW5kZXgsIGlucHV0KTtcbiAgICB2YXIgZmllbGRFeHByID0gY3JlYXRlQmluZEZpZWxkRXhwcihiaW5kaW5nSW5kZXgpO1xuICAgIHZhciBjdXJyVmFsRXhwciA9IGNyZWF0ZUN1cnJWYWx1ZUV4cHIoYmluZGluZ0luZGV4KTtcbiAgICB2YXIgc3RhdGVtZW50czogby5TdGF0ZW1lbnRbXSA9XG4gICAgICAgIFtkaXJlY3RpdmVJbnN0YW5jZS5wcm9wKGlucHV0LmRpcmVjdGl2ZU5hbWUpLnNldChjdXJyVmFsRXhwcikudG9TdG10KCldO1xuICAgIGlmIChjYWxjQ2hhbmdlc01hcCkge1xuICAgICAgc3RhdGVtZW50cy5wdXNoKG5ldyBvLklmU3RtdChEZXRlY3RDaGFuZ2VzVmFycy5jaGFuZ2VzLmlkZW50aWNhbChvLk5VTExfRVhQUiksIFtcbiAgICAgICAgRGV0ZWN0Q2hhbmdlc1ZhcnMuY2hhbmdlcy5zZXQoby5saXRlcmFsTWFwKFtdLCBuZXcgby5NYXBUeXBlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvLmltcG9ydFR5cGUoSWRlbnRpZmllcnMuU2ltcGxlQ2hhbmdlKSkpKVxuICAgICAgICAgICAgLnRvU3RtdCgpXG4gICAgICBdKSk7XG4gICAgICBzdGF0ZW1lbnRzLnB1c2goXG4gICAgICAgICAgRGV0ZWN0Q2hhbmdlc1ZhcnMuY2hhbmdlcy5rZXkoby5saXRlcmFsKGlucHV0LmRpcmVjdGl2ZU5hbWUpKVxuICAgICAgICAgICAgICAuc2V0KG8uaW1wb3J0RXhwcihJZGVudGlmaWVycy5TaW1wbGVDaGFuZ2UpLmluc3RhbnRpYXRlKFtmaWVsZEV4cHIsIGN1cnJWYWxFeHByXSkpXG4gICAgICAgICAgICAgIC50b1N0bXQoKSk7XG4gICAgfVxuICAgIGlmIChpc09uUHVzaENvbXApIHtcbiAgICAgIHN0YXRlbWVudHMucHVzaChEZXRlY3RDaGFuZ2VzVmFycy5jaGFuZ2VkLnNldChvLmxpdGVyYWwodHJ1ZSkpLnRvU3RtdCgpKTtcbiAgICB9XG4gICAgaWYgKHZpZXcuZ2VuQ29uZmlnLmxvZ0JpbmRpbmdVcGRhdGUpIHtcbiAgICAgIHN0YXRlbWVudHMucHVzaChcbiAgICAgICAgICBsb2dCaW5kaW5nVXBkYXRlU3RtdChjb21waWxlRWxlbWVudC5yZW5kZXJOb2RlLCBpbnB1dC5kaXJlY3RpdmVOYW1lLCBjdXJyVmFsRXhwcikpO1xuICAgIH1cbiAgICBiaW5kKHZpZXcsIGN1cnJWYWxFeHByLCBmaWVsZEV4cHIsIGlucHV0LnZhbHVlLCB2aWV3LmNvbXBvbmVudENvbnRleHQsIHN0YXRlbWVudHMsXG4gICAgICAgICBkZXRlY3RDaGFuZ2VzSW5JbnB1dHNNZXRob2QpO1xuICB9KTtcbiAgaWYgKGlzT25QdXNoQ29tcCkge1xuICAgIGRldGVjdENoYW5nZXNJbklucHV0c01ldGhvZC5hZGRTdG10KG5ldyBvLklmU3RtdChEZXRlY3RDaGFuZ2VzVmFycy5jaGFuZ2VkLCBbXG4gICAgICBjb21waWxlRWxlbWVudC5hcHBFbGVtZW50LnByb3AoJ2NvbXBvbmVudFZpZXcnKVxuICAgICAgICAgIC5jYWxsTWV0aG9kKCdtYXJrQXNDaGVja09uY2UnLCBbXSlcbiAgICAgICAgICAudG9TdG10KClcbiAgICBdKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbG9nQmluZGluZ1VwZGF0ZVN0bXQocmVuZGVyTm9kZTogby5FeHByZXNzaW9uLCBwcm9wTmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG8uRXhwcmVzc2lvbik6IG8uU3RhdGVtZW50IHtcbiAgcmV0dXJuIG8uVEhJU19FWFBSLnByb3AoJ3JlbmRlcmVyJylcbiAgICAgIC5jYWxsTWV0aG9kKCdzZXRCaW5kaW5nRGVidWdJbmZvJyxcbiAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgcmVuZGVyTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgby5saXRlcmFsKGBuZy1yZWZsZWN0LSR7Y2FtZWxDYXNlVG9EYXNoQ2FzZShwcm9wTmFtZSl9YCksXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLmlzQmxhbmsoKS5jb25kaXRpb25hbChvLk5VTExfRVhQUiwgdmFsdWUuY2FsbE1ldGhvZCgndG9TdHJpbmcnLCBbXSkpXG4gICAgICAgICAgICAgICAgICBdKVxuICAgICAgLnRvU3RtdCgpO1xufVxuIl19