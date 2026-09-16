from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class AdminAccountsPage(BasePage):
    def create_admin(self, name: str, email: str, password: str) -> None:
        self.open("/admins")
        self.visible((By.CSS_SELECTOR, "[data-testid='admin-name']"))
        self.wait.until(EC.invisibility_of_element_located((By.XPATH, "//*[contains(normalize-space(), 'Loading admin accounts') ]")))
        self.fill((By.CSS_SELECTOR, "[data-testid='admin-name']"), name)
        self.fill((By.CSS_SELECTOR, "[data-testid='admin-email']"), email)
        self.fill((By.CSS_SELECTOR, "[data-testid='admin-password']"), password)
        self.activate((By.CSS_SELECTOR, "[data-testid='create-admin']"))
        self.wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "[data-testid='admin-message']"), "Admin account created."))
