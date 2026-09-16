import time

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class LoginPage(BasePage):
    email = (By.CSS_SELECTOR, "[data-testid='login-email']")
    password = (By.CSS_SELECTOR, "[data-testid='login-password']")
    submit = (By.CSS_SELECTOR, "[data-testid='login-submit']")
    error = (By.CSS_SELECTOR, "[data-testid='login-error']")

    def open(self) -> None:
        super().open("/")
        field = self.wait.until(EC.presence_of_element_located(self.email))
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", field)
        self.visible(self.email)

    def login(self, email: str, password: str, destination: str) -> None:
        self.open()
        self.fill(self.email, email)
        self.fill(self.password, password)
        self.activate(self.submit)
        self.wait.until(EC.url_to_be(f"{self.base_url}{destination}"))
        # Let the client-side auth provider commit the new session before the next protected navigation.
        time.sleep(0.75)
        self.wait.until(EC.url_to_be(f"{self.base_url}{destination}"))

    def invalid_login(self, email: str, password: str) -> str:
        self.open()
        self.fill(self.email, email)
        self.fill(self.password, password)
        self.activate(self.submit)
        return self.visible(self.error).text
