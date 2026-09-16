from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.keys import Keys


class BasePage:
    def __init__(self, driver, base_url: str):
        self.driver = driver
        self.base_url = base_url
        self.wait = WebDriverWait(driver, 20)

    def open(self, path: str) -> None:
        self.driver.get(f"{self.base_url}{path}")

    def visible(self, locator):
        return self.wait.until(EC.visibility_of_element_located(locator))

    def clickable(self, locator):
        element = self.wait.until(EC.visibility_of_element_located(locator))
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center', behavior: 'instant'});", element)
        self.wait.until(lambda current: current.execute_script("const box=arguments[0].getBoundingClientRect(); return box.top >= 0 && box.bottom <= window.innerHeight;", element))
        return self.wait.until(EC.element_to_be_clickable(locator))

    def fill(self, locator, value: str) -> None:
        field = self.visible(locator)
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center', behavior: 'instant'});", field)
        field.click()
        field.send_keys(Keys.CONTROL, "a")
        field.send_keys(Keys.BACKSPACE)
        field.send_keys(value)
        # React's controlled state can be remounted while the landing-page animation is settling.
        # Use the native setter and bubbling input event only if normal keyboard entry was discarded.
        if field.get_attribute("value") != value:
            self.driver.execute_script("""
                const input = arguments[0], value = arguments[1];
                const prototype = input instanceof HTMLTextAreaElement
                    ? HTMLTextAreaElement.prototype
                    : HTMLInputElement.prototype;
                Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            """, field, value)
        self.wait.until(lambda current: current.find_element(*locator).get_attribute("value") == value)

    def activate(self, locator) -> None:
        """Activate a control through its real DOM click handler after explicit readiness checks."""
        element = self.clickable(locator)
        self.driver.execute_script("arguments[0].click();", element)

    def logout(self) -> None:
        # The fixed sidebar's lower control is covered by its animation container in headless Chrome;
        # dispatch the same DOM click after Selenium has made it visible and in-viewport.
        button = self.clickable(("css selector", "[data-testid='logout-button-secondary']"))
        self.driver.execute_script("arguments[0].click();", button)
        self.wait.until(EC.url_to_be(f"{self.base_url}/"))
