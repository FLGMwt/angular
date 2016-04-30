import { RouteSegment, Tree, TreeNode, rootNode } from './segments';
import { RoutesMetadata } from './metadata/metadata';
import { isBlank, isPresent, stringify } from 'angular2/src/facade/lang';
import { ListWrapper, StringMapWrapper } from 'angular2/src/facade/collection';
import { PromiseWrapper } from 'angular2/src/facade/promise';
import { BaseException } from 'angular2/src/facade/exceptions';
import { DEFAULT_OUTLET_NAME } from './constants';
import { reflector } from 'angular2/src/core/reflection/reflection';
// TODO: vsavkin: recognize should take the old tree and merge it
export function recognize(componentResolver, type, url) {
    let matched = new _MatchResult(type, [url.root], null, rootNode(url).children, []);
    return _constructSegment(componentResolver, matched)
        .then(roots => new Tree(roots[0]));
}
function _recognize(componentResolver, parentType, url) {
    let metadata = _readMetadata(parentType); // should read from the factory instead
    if (isBlank(metadata)) {
        throw new BaseException(`Component '${stringify(parentType)}' does not have route configuration`);
    }
    let match;
    try {
        match = _match(metadata, url);
    }
    catch (e) {
        return PromiseWrapper.reject(e, null);
    }
    let main = _constructSegment(componentResolver, match);
    let aux = _recognizeMany(componentResolver, parentType, match.aux).then(_checkOutletNameUniqueness);
    return PromiseWrapper.all([main, aux]).then(ListWrapper.flatten);
}
function _recognizeMany(componentResolver, parentType, urls) {
    let recognized = urls.map(u => _recognize(componentResolver, parentType, u));
    return PromiseWrapper.all(recognized).then(ListWrapper.flatten);
}
function _constructSegment(componentResolver, matched) {
    return componentResolver.resolveComponent(matched.component)
        .then(factory => {
        let urlOutlet = matched.consumedUrlSegments[0].outlet;
        let segment = new RouteSegment(matched.consumedUrlSegments, matched.parameters, isBlank(urlOutlet) ? DEFAULT_OUTLET_NAME : urlOutlet, matched.component, factory);
        if (matched.leftOverUrl.length > 0) {
            return _recognizeMany(componentResolver, matched.component, matched.leftOverUrl)
                .then(children => [new TreeNode(segment, children)]);
        }
        else {
            return _recognizeLeftOvers(componentResolver, matched.component)
                .then(children => [new TreeNode(segment, children)]);
        }
    });
}
function _recognizeLeftOvers(componentResolver, parentType) {
    return componentResolver.resolveComponent(parentType)
        .then(factory => {
        let metadata = _readMetadata(parentType);
        if (isBlank(metadata)) {
            return [];
        }
        let r = metadata.routes.filter(r => r.path == "" || r.path == "/");
        if (r.length === 0) {
            return PromiseWrapper.resolve([]);
        }
        else {
            return _recognizeLeftOvers(componentResolver, r[0].component)
                .then(children => {
                return componentResolver.resolveComponent(r[0].component)
                    .then(factory => {
                    let segment = new RouteSegment([], null, DEFAULT_OUTLET_NAME, r[0].component, factory);
                    return [new TreeNode(segment, children)];
                });
            });
        }
    });
}
function _match(metadata, url) {
    for (let r of metadata.routes) {
        let matchingResult = _matchWithParts(r, url);
        if (isPresent(matchingResult)) {
            return matchingResult;
        }
    }
    let availableRoutes = metadata.routes.map(r => `'${r.path}'`).join(", ");
    throw new BaseException(`Cannot match any routes. Current segment: '${url.value}'. Available routes: [${availableRoutes}].`);
}
function _matchWithParts(route, url) {
    let path = route.path.startsWith("/") ? route.path.substring(1) : route.path;
    let parts = path.split("/");
    let positionalParams = {};
    let consumedUrlSegments = [];
    let lastParent = null;
    let lastSegment = null;
    let current = url;
    for (let i = 0; i < parts.length; ++i) {
        if (isBlank(current))
            return null;
        let p = parts[i];
        let isLastSegment = i === parts.length - 1;
        let isLastParent = i === parts.length - 2;
        let isPosParam = p.startsWith(":");
        if (!isPosParam && p != current.value.segment)
            return null;
        if (isLastSegment) {
            lastSegment = current;
        }
        if (isLastParent) {
            lastParent = current;
        }
        if (isPosParam) {
            positionalParams[p.substring(1)] = current.value.segment;
        }
        consumedUrlSegments.push(current.value);
        current = ListWrapper.first(current.children);
    }
    if (isPresent(current) && isBlank(current.value.segment)) {
        lastParent = lastSegment;
        lastSegment = current;
    }
    let p = lastSegment.value.parameters;
    let parameters = StringMapWrapper.merge(isBlank(p) ? {} : p, positionalParams);
    let axuUrlSubtrees = isPresent(lastParent) ? lastParent.children.slice(1) : [];
    return new _MatchResult(route.component, consumedUrlSegments, parameters, lastSegment.children, axuUrlSubtrees);
}
function _checkOutletNameUniqueness(nodes) {
    let names = {};
    nodes.forEach(n => {
        let segmentWithSameOutletName = names[n.value.outlet];
        if (isPresent(segmentWithSameOutletName)) {
            let p = segmentWithSameOutletName.stringifiedUrlSegments;
            let c = n.value.stringifiedUrlSegments;
            throw new BaseException(`Two segments cannot have the same outlet name: '${p}' and '${c}'.`);
        }
        names[n.value.outlet] = n.value;
    });
    return nodes;
}
class _MatchResult {
    constructor(component, consumedUrlSegments, parameters, leftOverUrl, aux) {
        this.component = component;
        this.consumedUrlSegments = consumedUrlSegments;
        this.parameters = parameters;
        this.leftOverUrl = leftOverUrl;
        this.aux = aux;
    }
}
function _readMetadata(componentType) {
    let metadata = reflector.annotations(componentType).filter(f => f instanceof RoutesMetadata);
    return ListWrapper.first(metadata);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVjb2duaXplLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGlmZmluZ19wbHVnaW5fd3JhcHBlci1vdXRwdXRfcGF0aC1BTlM1VVU1RS50bXAvYW5ndWxhcjIvc3JjL2FsdF9yb3V0ZXIvcmVjb2duaXplLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJPQUFPLEVBQUMsWUFBWSxFQUFjLElBQUksRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFDLE1BQU0sWUFBWTtPQUN0RSxFQUFDLGNBQWMsRUFBZ0IsTUFBTSxxQkFBcUI7T0FDMUQsRUFBTyxPQUFPLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBQyxNQUFNLDBCQUEwQjtPQUNyRSxFQUFDLFdBQVcsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGdDQUFnQztPQUNyRSxFQUFDLGNBQWMsRUFBQyxNQUFNLDZCQUE2QjtPQUNuRCxFQUFDLGFBQWEsRUFBQyxNQUFNLGdDQUFnQztPQUVyRCxFQUFDLG1CQUFtQixFQUFDLE1BQU0sYUFBYTtPQUN4QyxFQUFDLFNBQVMsRUFBQyxNQUFNLHlDQUF5QztBQUVqRSxpRUFBaUU7QUFDakUsMEJBQTBCLGlCQUFvQyxFQUFFLElBQVUsRUFDaEQsR0FBcUI7SUFDN0MsSUFBSSxPQUFPLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ25GLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRSxPQUFPLENBQUM7U0FDL0MsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBZSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUFFRCxvQkFBb0IsaUJBQW9DLEVBQUUsVUFBZ0IsRUFDdEQsR0FBeUI7SUFDM0MsSUFBSSxRQUFRLEdBQUcsYUFBYSxDQUFDLFVB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LE1BQU0sQ0FBQyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7SUFDRSxZQUFtQixTQUFlLEVBQVMsbUJBQWlDLEVBQ3pELFVBQW1DLEVBQ25DLFdBQW1DLEVBQVMsR0FBMkI7UUFGdkUsY0FBUyxHQUFULFNBQVMsQ0FBTTtRQUFTLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBYztRQUN6RCxlQUFVLEdBQVYsVUFBVSxDQUF5QjtRQUNuQyxnQkFBVyxHQUFYLFdBQVcsQ0FBd0I7UUFBUyxRQUFHLEdBQUgsR0FBRyxDQUF3QjtJQUFHLENBQUM7QUFDaEcsQ0FBQztBQUVELHVCQUF1QixhQUFtQjtJQUN4QyxJQUFJLFFBQVEsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLGNBQWMsQ0FBQyxDQUFDO0lBQzdGLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3JDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1JvdXRlU2VnbWVudCwgVXJsU2VnbWVudCwgVHJlZSwgVHJlZU5vZGUsIHJvb3ROb2RlfSBmcm9tICcuL3NlZ21lbnRzJztcbmltcG9ydCB7Um91dGVzTWV0YWRhdGEsIFJvdXRlTWV0YWRhdGF9IGZyb20gJy4vbWV0YWRhdGEvbWV0YWRhdGEnO1xuaW1wb3J0IHtUeXBlLCBpc0JsYW5rLCBpc1ByZXNlbnQsIHN0cmluZ2lmeX0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9sYW5nJztcbmltcG9ydCB7TGlzdFdyYXBwZXIsIFN0cmluZ01hcFdyYXBwZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvY29sbGVjdGlvbic7XG5pbXBvcnQge1Byb21pc2VXcmFwcGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL3Byb21pc2UnO1xuaW1wb3J0IHtCYXNlRXhjZXB0aW9ufSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2V4Y2VwdGlvbnMnO1xuaW1wb3J0IHtDb21wb25lbnRSZXNvbHZlcn0gZnJvbSAnYW5ndWxhcjIvY29yZSc7XG5pbXBvcnQge0RFRkFVTFRfT1VUTEVUX05BTUV9IGZyb20gJy4vY29uc3RhbnRzJztcbmltcG9ydCB7cmVmbGVjdG9yfSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9yZWZsZWN0aW9uL3JlZmxlY3Rpb24nO1xuXG4vLyBUT0RPOiB2c2F2a2luOiByZWNvZ25pemUgc2hvdWxkIHRha2UgdGhlIG9sZCB0cmVlIGFuZCBtZXJnZSBpdFxuZXhwb3J0IGZ1bmN0aW9uIHJlY29nbml6ZShjb21wb25lbnRSZXNvbHZlcjogQ29tcG9uZW50UmVzb2x2ZXIsIHR5cGU6IFR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogVHJlZTxVcmxTZWdtZW50Pik6IFByb21pc2U8VHJlZTxSb3V0ZVNlZ21lbnQ+PiB7XG4gIGxldCBtYXRjaGVkID0gbmV3IF9NYXRjaFJlc3VsdCh0eXBlLCBbdXJsLnJvb3RdLCBudWxsLCByb290Tm9kZSh1cmwpLmNoaWxkcmVuLCBbXSk7XG4gIHJldHVybiBfY29uc3RydWN0U2VnbWVudChjb21wb25lbnRSZXNvbHZlciwgbWF0Y2hlZClcbiAgICAgIC50aGVuKHJvb3RzID0+IG5ldyBUcmVlPFJvdXRlU2VnbWVudD4ocm9vdHNbMF0pKTtcbn1cblxuZnVuY3Rpb24gX3JlY29nbml6ZShjb21wb25lbnRSZXNvbHZlcjogQ29tcG9uZW50UmVzb2x2ZXIsIHBhcmVudFR5cGU6IFR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHVybDogVHJlZU5vZGU8VXJsU2VnbWVudD4pOiBQcm9taXNlPFRyZWVOb2RlPFJvdXRlU2VnbWVudD5bXT4ge1xuICBsZXQgbWV0YWRhdGEgPSBfcmVhZE1ldGFkYXRhKHBhcmVudFR5cGUpOyAgLy8gc2hvdWxkIHJlYWQgZnJvbSB0aGUgZmFjdG9yeSBpbnN0ZWFkXG4gIGlmIChpc0JsYW5rKG1ldGFkYXRhKSkge1xuICAgIHRocm93IG5ldyBCYXNlRXhjZXB0aW9uKFxuICAgICAgICBgQ29tcG9uZW50ICcke3N0cmluZ2lmeShwYXJlbnRUeXBlKX0nIGRvZXMgbm90IGhhdmUgcm91dGUgY29uZmlndXJhdGlvbmApO1xuICB9XG5cbiAgbGV0IG1hdGNoO1xuICB0cnkge1xuICAgIG1hdGNoID0gX21hdGNoKG1ldGFkYXRhLCB1cmwpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIFByb21pc2VXcmFwcGVyLnJlamVjdChlLCBudWxsKTtcbiAgfVxuXG4gIGxldCBtYWluID0gX2NvbnN0cnVjdFNlZ21lbnQoY29tcG9uZW50UmVzb2x2ZXIsIG1hdGNoKTtcbiAgbGV0IGF1eCA9XG4gICAgICBfcmVjb2duaXplTWFueShjb21wb25lbnRSZXNvbHZlciwgcGFyZW50VHlwZSwgbWF0Y2guYXV4KS50aGVuKF9jaGVja091dGxldE5hbWVVbmlxdWVuZXNzKTtcbiAgcmV0dXJuIFByb21pc2VXcmFwcGVyLmFsbChbbWFpbiwgYXV4XSkudGhlbihMaXN0V3JhcHBlci5mbGF0dGVuKTtcbn1cblxuZnVuY3Rpb24gX3JlY29nbml6ZU1hbnkoY29tcG9uZW50UmVzb2x2ZXI6IENvbXBvbmVudFJlc29sdmVyLCBwYXJlbnRUeXBlOiBUeXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsczogVHJlZU5vZGU8VXJsU2VnbWVudD5bXSk6IFByb21pc2U8VHJlZU5vZGU8Um91dGVTZWdtZW50PltdPiB7XG4gIGxldCByZWNvZ25pemVkID0gdXJscy5tYXAodSA9PiBfcmVjb2duaXplKGNvbXBvbmVudFJlc29sdmVyLCBwYXJlbnRUeXBlLCB1KSk7XG4gIHJldHVybiBQcm9taXNlV3JhcHBlci5hbGwocmVjb2duaXplZCkudGhlbihMaXN0V3JhcHBlci5mbGF0dGVuKTtcbn1cblxuZnVuY3Rpb24gX2NvbnN0cnVjdFNlZ21lbnQoY29tcG9uZW50UmVzb2x2ZXI6IENvbXBvbmVudFJlc29sdmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hlZDogX01hdGNoUmVzdWx0KTogUHJvbWlzZTxUcmVlTm9kZTxSb3V0ZVNlZ21lbnQ+W10+IHtcbiAgcmV0dXJuIGNvbXBvbmVudFJlc29sdmVyLnJlc29sdmVDb21wb25lbnQobWF0Y2hlZC5jb21wb25lbnQpXG4gICAgICAudGhlbihmYWN0b3J5ID0+IHtcbiAgICAgICAgbGV0IHVybE91dGxldCA9IG1hdGNoZWQuY29uc3VtZWRVcmxTZWdtZW50c1swXS5vdXRsZXQ7XG4gICAgICAgIGxldCBzZWdtZW50ID0gbmV3IFJvdXRlU2VnbWVudChtYXRjaGVkLmNvbnN1bWVkVXJsU2VnbWVudHMsIG1hdGNoZWQucGFyYW1ldGVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQmxhbmsodXJsT3V0bGV0KSA/IERFRkFVTFRfT1VUTEVUX05BTUUgOiB1cmxPdXRsZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGVkLmNvbXBvbmVudCwgZmFjdG9yeSk7XG5cbiAgICAgICAgaWYgKG1hdGNoZWQubGVmdE92ZXJVcmwubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBfcmVjb2duaXplTWFueShjb21wb25lbnRSZXNvbHZlciwgbWF0Y2hlZC5jb21wb25lbnQsIG1hdGNoZWQubGVmdE92ZXJVcmwpXG4gICAgICAgICAgICAgIC50aGVuKGNoaWxkcmVuID0+IFtuZXcgVHJlZU5vZGU8Um91dGVTZWdtZW50PihzZWdtZW50LCBjaGlsZHJlbildKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gX3JlY29nbml6ZUxlZnRPdmVycyhjb21wb25lbnRSZXNvbHZlciwgbWF0Y2hlZC5jb21wb25lbnQpXG4gICAgICAgICAgICAgIC50aGVuKGNoaWxkcmVuID0+IFtuZXcgVHJlZU5vZGU8Um91dGVTZWdtZW50PihzZWdtZW50LCBjaGlsZHJlbildKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG59XG5cbmZ1bmN0aW9uIF9yZWNvZ25pemVMZWZ0T3ZlcnMoY29tcG9uZW50UmVzb2x2ZXI6IENvbXBvbmVudFJlc29sdmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRUeXBlOiBUeXBlKTogUHJvbWlzZTxUcmVlTm9kZTxSb3V0ZVNlZ21lbnQ+W10+IHtcbiAgcmV0dXJuIGNvbXBvbmVudFJlc29sdmVyLnJlc29sdmVDb21wb25lbnQocGFyZW50VHlwZSlcbiAgICAgIC50aGVuKGZhY3RvcnkgPT4ge1xuICAgICAgICBsZXQgbWV0YWRhdGEgPSBfcmVhZE1ldGFkYXRhKHBhcmVudFR5cGUpO1xuICAgICAgICBpZiAoaXNCbGFuayhtZXRhZGF0YSkpIHtcbiAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgciA9ICg8YW55W10+bWV0YWRhdGEucm91dGVzKS5maWx0ZXIociA9PiByLnBhdGggPT0gXCJcIiB8fCByLnBhdGggPT0gXCIvXCIpO1xuICAgICAgICBpZiAoci5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZVdyYXBwZXIucmVzb2x2ZShbXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIF9yZWNvZ25pemVMZWZ0T3ZlcnMoY29tcG9uZW50UmVzb2x2ZXIsIHJbMF0uY29tcG9uZW50KVxuICAgICAgICAgICAgICAudGhlbihjaGlsZHJlbiA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBvbmVudFJlc29sdmVyLnJlc29sdmVDb21wb25lbnQoclswXS5jb21wb25lbnQpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZhY3RvcnkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGxldCBzZWdtZW50ID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFJvdXRlU2VnbWVudChbXSwgbnVsbCwgREVGQVVMVF9PVVRMRVRfTkFNRSwgclswXS5jb21wb25lbnQsIGZhY3RvcnkpO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbbmV3IFRyZWVOb2RlPFJvdXRlU2VnbWVudD4oc2VnbWVudCwgY2hpbGRyZW4pXTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbn1cblxuZnVuY3Rpb24gX21hdGNoKG1ldGFkYXRhOiBSb3V0ZXNNZXRhZGF0YSwgdXJsOiBUcmVlTm9kZTxVcmxTZWdtZW50Pik6IF9NYXRjaFJlc3VsdCB7XG4gIGZvciAobGV0IHIgb2YgbWV0YWRhdGEucm91dGVzKSB7XG4gICAgbGV0IG1hdGNoaW5nUmVzdWx0ID0gX21hdGNoV2l0aFBhcnRzKHIsIHVybCk7XG4gICAgaWYgKGlzUHJlc2VudChtYXRjaGluZ1Jlc3VsdCkpIHtcbiAgICAgIHJldHVybiBtYXRjaGluZ1Jlc3VsdDtcbiAgICB9XG4gIH1cbiAgbGV0IGF2YWlsYWJsZVJvdXRlcyA9IG1ldGFkYXRhLnJvdXRlcy5tYXAociA9PiBgJyR7ci5wYXRofSdgKS5qb2luKFwiLCBcIik7XG4gIHRocm93IG5ldyBCYXNlRXhjZXB0aW9uKFxuICAgICAgYENhbm5vdCBtYXRjaCBhbnkgcm91dGVzLiBDdXJyZW50IHNlZ21lbnQ6ICcke3VybC52YWx1ZX0nLiBBdmFpbGFibGUgcm91dGVzOiBbJHthdmFpbGFibGVSb3V0ZXN9XS5gKTtcbn1cblxuZnVuY3Rpb24gX21hdGNoV2l0aFBhcnRzKHJvdXRlOiBSb3V0ZU1ldGFkYXRhLCB1cmw6IFRyZWVOb2RlPFVybFNlZ21lbnQ+KTogX01hdGNoUmVzdWx0IHtcbiAgbGV0IHBhdGggPSByb3V0ZS5wYXRoLnN0YXJ0c1dpdGgoXCIvXCIpID8gcm91dGUucGF0aC5zdWJzdHJpbmcoMSkgOiByb3V0ZS5wYXRoO1xuICBsZXQgcGFydHMgPSBwYXRoLnNwbGl0KFwiL1wiKTtcbiAgbGV0IHBvc2l0aW9uYWxQYXJhbXMgPSB7fTtcbiAgbGV0IGNvbnN1bWVkVXJsU2VnbWVudHMgPSBbXTtcblxuICBsZXQgbGFzdFBhcmVudDogVHJlZU5vZGU8VXJsU2VnbWVudD4gPSBudWxsO1xuICBsZXQgbGFzdFNlZ21lbnQ6IFRyZWVOb2RlPFVybFNlZ21lbnQ+ID0gbnVsbDtcblxuICBsZXQgY3VycmVudCA9IHVybDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7ICsraSkge1xuICAgIGlmIChpc0JsYW5rKGN1cnJlbnQpKSByZXR1cm4gbnVsbDtcblxuICAgIGxldCBwID0gcGFydHNbaV07XG4gICAgbGV0IGlzTGFzdFNlZ21lbnQgPSBpID09PSBwYXJ0cy5sZW5ndGggLSAxO1xuICAgIGxldCBpc0xhc3RQYXJlbnQgPSBpID09PSBwYXJ0cy5sZW5ndGggLSAyO1xuICAgIGxldCBpc1Bvc1BhcmFtID0gcC5zdGFydHNXaXRoKFwiOlwiKTtcblxuICAgIGlmICghaXNQb3NQYXJhbSAmJiBwICE9IGN1cnJlbnQudmFsdWUuc2VnbWVudCkgcmV0dXJuIG51bGw7XG4gICAgaWYgKGlzTGFzdFNlZ21lbnQpIHtcbiAgICAgIGxhc3RTZWdtZW50ID0gY3VycmVudDtcbiAgICB9XG4gICAgaWYgKGlzTGFzdFBhcmVudCkge1xuICAgICAgbGFzdFBhcmVudCA9IGN1cnJlbnQ7XG4gICAgfVxuXG4gICAgaWYgKGlzUG9zUGFyYW0pIHtcbiAgICAgIHBvc2l0aW9uYWxQYXJhbXNbcC5zdWJzdHJpbmcoMSldID0gY3VycmVudC52YWx1ZS5zZWdtZW50O1xuICAgIH1cblxuICAgIGNvbnN1bWVkVXJsU2VnbWVudHMucHVzaChjdXJyZW50LnZhbHVlKTtcblxuICAgIGN1cnJlbnQgPSBMaXN0V3JhcHBlci5maXJzdChjdXJyZW50LmNoaWxkcmVuKTtcbiAgfVxuXG4gIGlmIChpc1ByZXNlbnQoY3VycmVudCkgJiYgaXNCbGFuayhjdXJyZW50LnZhbHVlLnNlZ21lbnQpKSB7XG4gICAgbGFzdFBhcmVudCA9IGxhc3RTZWdtZW50O1xuICAgIGxhc3RTZWdtZW50ID0gY3VycmVudDtcbiAgfVxuXG4gIGxldCBwID0gbGFzdFNlZ21lbnQudmFsdWUucGFyYW1ldGVycztcbiAgbGV0IHBhcmFtZXRlcnMgPVxuICAgICAgPHtba2V5OiBzdHJpbmddOiBzdHJpbmd9PlN0cmluZ01hcFdyYXBwZXIubWVyZ2UoaXNCbGFuayhwKSA/IHt9IDogcCwgcG9zaXRpb25hbFBhcmFtcyk7XG4gIGxldCBheHVVcmxTdWJ0cmVlcyA9IGlzUHJlc2VudChsYXN0UGFyZW50KSA/IGxhc3RQYXJlbnQuY2hpbGRyZW4uc2xpY2UoMSkgOiBbXTtcblxuICByZXR1cm4gbmV3IF9NYXRjaFJlc3VsdChyb3V0ZS5jb21wb25lbnQsIGNvbnN1bWVkVXJsU2VnbWVudHMsIHBhcmFtZXRlcnMsIGxhc3RTZWdtZW50LmNoaWxkcmVuLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBheHVVcmxTdWJ0cmVlcyk7XG59XG5cbmZ1bmN0aW9uIF9jaGVja091dGxldE5hbWVVbmlxdWVuZXNzKG5vZGVzOiBUcmVlTm9kZTxSb3V0ZVNlZ21lbnQ+W10pOiBUcmVlTm9kZTxSb3V0ZVNlZ21lbnQ+W10ge1xuICBsZXQgbmFtZXMgPSB7fTtcbiAgbm9kZXMuZm9yRWFjaChuID0+IHtcbiAgICBsZXQgc2VnbWVudFdpdGhTYW1lT3V0bGV0TmFtZSA9IG5hbWVzW24udmFsdWUub3V0bGV0XTtcbiAgICBpZiAoaXNQcmVzZW50KHNlZ21lbnRXaXRoU2FtZU91dGxldE5hbWUpKSB7XG4gICAgICBsZXQgcCA9IHNlZ21lbnRXaXRoU2FtZU91dGxldE5hbWUuc3RyaW5naWZpZWRVcmxTZWdtZW50cztcbiAgICAgIGxldCBjID0gbi52YWx1ZS5zdHJpbmdpZmllZFVybFNlZ21lbnRzO1xuICAgICAgdGhyb3cgbmV3IEJhc2VFeGNlcHRpb24oYFR3byBzZWdtZW50cyBjYW5ub3QgaGF2ZSB0aGUgc2FtZSBvdXRsZXQgbmFtZTogJyR7cH0nIGFuZCAnJHtjfScuYCk7XG4gICAgfVxuICAgIG5hbWVzW24udmFsdWUub3V0bGV0XSA9IG4udmFsdWU7XG4gIH0pO1xuICByZXR1cm4gbm9kZXM7XG59XG5cbmNsYXNzIF9NYXRjaFJlc3VsdCB7XG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBjb21wb25lbnQ6IFR5cGUsIHB1YmxpYyBjb25zdW1lZFVybFNlZ21lbnRzOiBVcmxTZWdtZW50W10sXG4gICAgICAgICAgICAgIHB1YmxpYyBwYXJhbWV0ZXJzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSxcbiAgICAgICAgICAgICAgcHVibGljIGxlZnRPdmVyVXJsOiBUcmVlTm9kZTxVcmxTZWdtZW50PltdLCBwdWJsaWMgYXV4OiBUcmVlTm9kZTxVcmxTZWdtZW50PltdKSB7fVxufVxuXG5mdW5jdGlvbiBfcmVhZE1ldGFkYXRhKGNvbXBvbmVudFR5cGU6IFR5cGUpIHtcbiAgbGV0IG1ldGFkYXRhID0gcmVmbGVjdG9yLmFubm90YXRpb25zKGNvbXBvbmVudFR5cGUpLmZpbHRlcihmID0+IGYgaW5zdGFuY2VvZiBSb3V0ZXNNZXRhZGF0YSk7XG4gIHJldHVybiBMaXN0V3JhcHBlci5maXJzdChtZXRhZGF0YSk7XG59Il19