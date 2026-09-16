from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class SubjectsPage(BasePage):
    name = (By.CSS_SELECTOR, "[data-testid='subject-name']")
    code = (By.CSS_SELECTOR, "[data-testid='subject-code']")
    category = (By.CSS_SELECTOR, "[data-testid='subject-category']")
    save = (By.CSS_SELECTOR, "[data-testid='save-subject']")
    message = (By.CSS_SELECTOR, "[data-testid='subject-message']")

    def create(self, name: str, code: str, category: str = "academic", expected_message: str = "Subject created.") -> None:
        self.open("/subjects")
        self.fill(self.name, name)
        self.fill(self.code, code)
        self.fill(self.category, category)
        self.activate(self.save)
        self.wait.until(EC.text_to_be_present_in_element(self.message, expected_message))

    def edit(self, subject_id: int, name: str, code: str) -> None:
        self.activate((By.CSS_SELECTOR, f"[data-testid='edit-subject-{subject_id}']"))
        self.fill(self.name, name)
        self.fill(self.code, code)
        self.activate(self.save)
        self.wait.until(EC.text_to_be_present_in_element(self.message, "Subject updated."))

    def delete(self, subject_id: int) -> None:
        button = self.clickable((By.CSS_SELECTOR, f"[data-testid='delete-subject-{subject_id}']"))
        self.driver.execute_script("window.confirm = () => true; arguments[0].click();", button)
        self.wait.until(EC.text_to_be_present_in_element(self.message, "Subject deleted."))
