import { verifyNoBrowserErrors, browser } from 'angular2/src/testing/e2e_util';
import { expect } from 'angular2/testing';
function waitForElement(selector) {
    var EC = protractor.ExpectedConditions;
    // Waits for the element with id 'abc' to be present on the dom.
    browser.wait(EC.presenceOf($(selector)), 20000);
}
function waitForAlert() {
    var EC = protractor.ExpectedConditions;
    browser.wait(EC.alertIsPresent(), 1000);
}
describe('can deactivate example app', function () {
    afterEach(verifyNoBrowserErrors);
    var URL = 'angular2/examples/router/ts/can_deactivate/';
    it('should not navigate away when prompt is cancelled', function () {
        browser.get(URL);
        waitForElement('note-index-cmp');
        element(by.css('#note-1-link')).click();
        waitForElement('note-cmp');
        browser.navigate().back();
        waitForAlert();
        browser.switchTo().alert().dismiss(); // Use to simulate cancel button
        expect(element(by.css('note-cmp')).getText()).toContain('id: 1');
    });
    it('should navigate away when prompt is confirmed', function () {
        browser.get(URL);
        waitForElement('note-index-cmp');
        element(by.css('#note-1-link')).click();
        waitForElement('note-cmp');
        browser.navigate().back();
        waitForAlert();
        browser.switchTo().alert().accept();
        waitForElement('note-index-cmp');
        expect(element(by.css('note-index-cmp')).getText()).toContain('Your Notes');
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FuX2RlYWN0aXZhdGVfc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpZmZpbmdfcGx1Z2luX3dyYXBwZXItb3V0cHV0X3BhdGgtN2QycFNjbm0udG1wL2FuZ3VsYXIyL2V4YW1wbGVzL3JvdXRlci90cy9jYW5fZGVhY3RpdmF0ZS9jYW5fZGVhY3RpdmF0ZV9zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJPQUFPLEVBQUMscUJBQXFCLEVBQUUsT0FBTyxFQUFDLE1BQU0sK0JBQStCO09BQ3JFLEVBQUMsTUFBTSxFQUFDLE1BQU0sa0JBQWtCO0FBRXZDLHdCQUF3QixRQUFnQjtJQUN0QyxJQUFJLEVBQUUsR0FBUyxVQUFXLENBQUMsa0JBQWtCLENBQUM7SUFDOUMsZ0VBQWdFO0lBQ2hFLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQ7SUFDRSxJQUFJLEVBQUUsR0FBUyxVQUFXLENBQUMsa0JBQWtCLENBQUM7SUFDOUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDMUMsQ0FBQztBQUVELFFBQVEsQ0FBQyw0QkFBNEIsRUFBRTtJQUVyQyxTQUFTLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUVqQyxJQUFJLEdBQUcsR0FBRyw2Q0FBNkMsQ0FBQztJQUV4RCxFQUFFLENBQUMsbURBQW1ELEVBQUU7UUFDdEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQixjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUVqQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3hDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUzQixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUIsWUFBWSxFQUFFLENBQUM7UUFFZixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBRSxnQ0FBZ0M7UUFFdkUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkUsQ0FBQyxDQUFDLENBQUM7SUFFSCxFQUFFLENBQUMsK0NBQStDLEVBQUU7UUFDbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQixjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUVqQyxPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3hDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUUzQixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDMUIsWUFBWSxFQUFFLENBQUM7UUFFZixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFcEMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFFakMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUM5RSxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHt2ZXJpZnlOb0Jyb3dzZXJFcnJvcnMsIGJyb3dzZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy90ZXN0aW5nL2UyZV91dGlsJztcbmltcG9ydCB7ZXhwZWN0fSBmcm9tICdhbmd1bGFyMi90ZXN0aW5nJztcblxuZnVuY3Rpb24gd2FpdEZvckVsZW1lbnQoc2VsZWN0b3I6IHN0cmluZykge1xuICB2YXIgRUMgPSAoPGFueT5wcm90cmFjdG9yKS5FeHBlY3RlZENvbmRpdGlvbnM7XG4gIC8vIFdhaXRzIGZvciB0aGUgZWxlbWVudCB3aXRoIGlkICdhYmMnIHRvIGJlIHByZXNlbnQgb24gdGhlIGRvbS5cbiAgYnJvd3Nlci53YWl0KEVDLnByZXNlbmNlT2YoJChzZWxlY3RvcikpLCAyMDAwMCk7XG59XG5cbmZ1bmN0aW9uIHdhaXRGb3JBbGVydCgpIHtcbiAgdmFyIEVDID0gKDxhbnk+cHJvdHJhY3RvcikuRXhwZWN0ZWRDb25kaXRpb25zO1xuICBicm93c2VyLndhaXQoRUMuYWxlcnRJc1ByZXNlbnQoKSwgMTAwMCk7XG59XG5cbmRlc2NyaWJlKCdjYW4gZGVhY3RpdmF0ZSBleGFtcGxlIGFwcCcsIGZ1bmN0aW9uKCkge1xuXG4gIGFmdGVyRWFjaCh2ZXJpZnlOb0Jyb3dzZXJFcnJvcnMpO1xuXG4gIHZhciBVUkwgPSAnYW5ndWxhcjIvZXhhbXBsZXMvcm91dGVyL3RzL2Nhbl9kZWFjdGl2YXRlLyc7XG5cbiAgaXQoJ3Nob3VsZCBub3QgbmF2aWdhdGUgYXdheSB3aGVuIHByb21wdCBpcyBjYW5jZWxsZWQnLCBmdW5jdGlvbigpIHtcbiAgICBicm93c2VyLmdldChVUkwpO1xuICAgIHdhaXRGb3JFbGVtZW50KCdub3RlLWluZGV4LWNtcCcpO1xuXG4gICAgZWxlbWVudChieS5jc3MoJyNub3RlLTEtbGluaycpKS5jbGljaygpO1xuICAgIHdhaXRGb3JFbGVtZW50KCdub3RlLWNtcCcpO1xuXG4gICAgYnJvd3Nlci5uYXZpZ2F0ZSgpLmJhY2soKTtcbiAgICB3YWl0Rm9yQWxlcnQoKTtcblxuICAgIGJyb3dzZXIuc3dpdGNoVG8oKS5hbGVydCgpLmRpc21pc3MoKTsgIC8vIFVzZSB0byBzaW11bGF0ZSBjYW5jZWwgYnV0dG9uXG5cbiAgICBleHBlY3QoZWxlbWVudChieS5jc3MoJ25vdGUtY21wJykpLmdldFRleHQoKSkudG9Db250YWluKCdpZDogMScpO1xuICB9KTtcblxuICBpdCgnc2hvdWxkIG5hdmlnYXRlIGF3YXkgd2hlbiBwcm9tcHQgaXMgY29uZmlybWVkJywgZnVuY3Rpb24oKSB7XG4gICAgYnJvd3Nlci5nZXQoVVJMKTtcbiAgICB3YWl0Rm9yRWxlbWVudCgnbm90ZS1pbmRleC1jbXAnKTtcblxuICAgIGVsZW1lbnQoYnkuY3NzKCcjbm90ZS0xLWxpbmsnKSkuY2xpY2soKTtcbiAgICB3YWl0Rm9yRWxlbWVudCgnbm90ZS1jbXAnKTtcblxuICAgIGJyb3dzZXIubmF2aWdhdGUoKS5iYWNrKCk7XG4gICAgd2FpdEZvckFsZXJ0KCk7XG5cbiAgICBicm93c2VyLnN3aXRjaFRvKCkuYWxlcnQoKS5hY2NlcHQoKTtcblxuICAgIHdhaXRGb3JFbGVtZW50KCdub3RlLWluZGV4LWNtcCcpO1xuXG4gICAgZXhwZWN0KGVsZW1lbnQoYnkuY3NzKCdub3RlLWluZGV4LWNtcCcpKS5nZXRUZXh0KCkpLnRvQ29udGFpbignWW91ciBOb3RlcycpO1xuICB9KTtcbn0pO1xuIl19