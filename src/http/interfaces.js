'use strict';"use strict";
/**
 * Abstract class from which real backends are derived.
 *
 * The primary purpose of a `ConnectionBackend` is to create new connections to fulfill a given
 * {@link Request}.
 */
var ConnectionBackend = (function () {
    function ConnectionBackend() {
    }
    return ConnectionBackend;
}());
exports.ConnectionBackend = ConnectionBackend;
/**
 * Abstract class from which real connections are derived.
 */
var Connection = (function () {
    function Connection() {
    }
    return Connection;
}());
exports.Connection = Connection;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpZmZpbmdfcGx1Z2luX3dyYXBwZXItb3V0cHV0X3BhdGgtYk9ValRHM2cudG1wL2FuZ3VsYXIyL3NyYy9odHRwL2ludGVyZmFjZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BOzs7OztHQUtHO0FBQ0g7SUFBQTtJQUErRixDQUFDO0lBQUQsd0JBQUM7QUFBRCxDQUFDLEFBQWhHLElBQWdHO0FBQTFFLHlCQUFpQixvQkFBeUQsQ0FBQTtBQUVoRzs7R0FFRztBQUNIO0lBQUE7SUFJQSxDQUFDO0lBQUQsaUJBQUM7QUFBRCxDQUFDLEFBSkQsSUFJQztBQUpxQixrQkFBVSxhQUkvQixDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtSZWFkeVN0YXRlLCBSZXF1ZXN0TWV0aG9kLCBSZXNwb25zZVR5cGV9IGZyb20gJy4vZW51bXMnO1xuaW1wb3J0IHtIZWFkZXJzfSBmcm9tICcuL2hlYWRlcnMnO1xuaW1wb3J0IHtCYXNlRXhjZXB0aW9uLCBXcmFwcGVkRXhjZXB0aW9ufSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2V4Y2VwdGlvbnMnO1xuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvYXN5bmMnO1xuaW1wb3J0IHtSZXF1ZXN0fSBmcm9tICcuL3N0YXRpY19yZXF1ZXN0JztcbmltcG9ydCB7VVJMU2VhcmNoUGFyYW1zfSBmcm9tICcuL3VybF9zZWFyY2hfcGFyYW1zJztcblxuLyoqXG4gKiBBYnN0cmFjdCBjbGFzcyBmcm9tIHdoaWNoIHJlYWwgYmFja2VuZHMgYXJlIGRlcml2ZWQuXG4gKlxuICogVGhlIHByaW1hcnkgcHVycG9zZSBvZiBhIGBDb25uZWN0aW9uQmFja2VuZGAgaXMgdG8gY3JlYXRlIG5ldyBjb25uZWN0aW9ucyB0byBmdWxmaWxsIGEgZ2l2ZW5cbiAqIHtAbGluayBSZXF1ZXN0fS5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbm5lY3Rpb25CYWNrZW5kIHsgYWJzdHJhY3QgY3JlYXRlQ29ubmVjdGlvbihyZXF1ZXN0OiBhbnkpOiBDb25uZWN0aW9uOyB9XG5cbi8qKlxuICogQWJzdHJhY3QgY2xhc3MgZnJvbSB3aGljaCByZWFsIGNvbm5lY3Rpb25zIGFyZSBkZXJpdmVkLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29ubmVjdGlvbiB7XG4gIHJlYWR5U3RhdGU6IFJlYWR5U3RhdGU7XG4gIHJlcXVlc3Q6IFJlcXVlc3Q7XG4gIHJlc3BvbnNlOiBhbnk7ICAvLyBUT0RPOiBnZW5lcmljIG9mIDxSZXNwb25zZT47XG59XG5cbi8qKlxuICogSW50ZXJmYWNlIGZvciBvcHRpb25zIHRvIGNvbnN0cnVjdCBhIFJlcXVlc3RPcHRpb25zLCBiYXNlZCBvblxuICogW1JlcXVlc3RJbml0XShodHRwczovL2ZldGNoLnNwZWMud2hhdHdnLm9yZy8jcmVxdWVzdGluaXQpIGZyb20gdGhlIEZldGNoIHNwZWMuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVxdWVzdE9wdGlvbnNBcmdzIHtcbiAgdXJsPzogc3RyaW5nO1xuICBtZXRob2Q/OiBzdHJpbmcgfCBSZXF1ZXN0TWV0aG9kO1xuICBzZWFyY2g/OiBzdHJpbmcgfCBVUkxTZWFyY2hQYXJhbXM7XG4gIGhlYWRlcnM/OiBIZWFkZXJzO1xuICAvLyBUT0RPOiBTdXBwb3J0IEJsb2IsIEFycmF5QnVmZmVyLCBKU09OLCBVUkxTZWFyY2hQYXJhbXMsIEZvcm1EYXRhXG4gIGJvZHk/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogUmVxdWlyZWQgc3RydWN0dXJlIHdoZW4gY29uc3RydWN0aW5nIG5ldyBSZXF1ZXN0KCk7XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVxdWVzdEFyZ3MgZXh0ZW5kcyBSZXF1ZXN0T3B0aW9uc0FyZ3MgeyB1cmw6IHN0cmluZzsgfVxuXG4vKipcbiAqIEludGVyZmFjZSBmb3Igb3B0aW9ucyB0byBjb25zdHJ1Y3QgYSBSZXNwb25zZSwgYmFzZWQgb25cbiAqIFtSZXNwb25zZUluaXRdKGh0dHBzOi8vZmV0Y2guc3BlYy53aGF0d2cub3JnLyNyZXNwb25zZWluaXQpIGZyb20gdGhlIEZldGNoIHNwZWMuXG4gKi9cbmV4cG9ydCB0eXBlIFJlc3BvbnNlT3B0aW9uc0FyZ3MgPSB7XG4gIC8vIFRPRE86IFN1cHBvcnQgQmxvYiwgQXJyYXlCdWZmZXIsIEpTT05cbiAgYm9keT86IHN0cmluZyB8IE9iamVjdCB8IEZvcm1EYXRhO1xuICBzdGF0dXM/OiBudW1iZXI7XG4gIHN0YXR1c1RleHQ/OiBzdHJpbmc7XG4gIGhlYWRlcnM/OiBIZWFkZXJzO1xuICB0eXBlPzogUmVzcG9uc2VUeXBlO1xuICB1cmw/OiBzdHJpbmc7XG59XG4iXX0=