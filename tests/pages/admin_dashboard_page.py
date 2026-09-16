from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class AdminDashboardPage(BasePage):
    def create_cadet(self, name: str, email: str, password: str, subject_id: int) -> None:
        # A staff member can provision several cadets in one session. Avoid an
        # unnecessary full reload after a successful submission, which turns a
        # second creation into an unrelated session-restoration test.
        if self.driver.current_url.rstrip("/") != f"{self.base_url}/admin":
            self.open("/admin")
        self.activate((By.CSS_SELECTOR, "[data-testid='show-create-cadet']"))
        self.fill((By.CSS_SELECTOR, "[data-testid='cadet-name']"), name)
        self.fill((By.CSS_SELECTOR, "[data-testid='cadet-email']"), email)
        self.fill((By.CSS_SELECTOR, "[data-testid='cadet-password']"), password)
        self.activate((By.CSS_SELECTOR, f"[data-testid='cadet-subject-{subject_id}']"))
        self.activate((By.CSS_SELECTOR, "[data-testid='create-cadet']"))
        self.wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "[data-testid='cadet-message']"), "Cadet created successfully."))
