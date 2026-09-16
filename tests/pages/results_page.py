from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from .base_page import BasePage


class ResultsPage(BasePage):
    create_exam = (By.CSS_SELECTOR, "[data-testid='create-exam']")
    exam_name = (By.CSS_SELECTOR, "[data-testid='exam-name']")
    max_marks = (By.CSS_SELECTOR, "[data-testid='exam-max-marks']")
    save_exam = (By.CSS_SELECTOR, "[data-testid='save-exam']")

    def create(self, name: str, max_marks: str = "100") -> None:
        self.open("/results")
        self.activate(self.create_exam)
        self.fill(self.exam_name, name)
        self.fill(self.max_marks, max_marks)
        self.activate(self.save_exam)
        self.wait.until(EC.invisibility_of_element_located(self.exam_name))

    def select_exam(self, exam_id: int) -> None:
        self.activate((By.CSS_SELECTOR, f"[data-testid='exam-{exam_id}']"))

    def save_result(self, cadet_id: int, marks: str, remarks: str) -> None:
        marks_locator = (By.CSS_SELECTOR, f"[data-testid='result-marks-{cadet_id}']")
        marks_field = self.visible(marks_locator)
        self.driver.execute_script("""
            const input = arguments[0], value = arguments[1];
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
            input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        """, marks_field, marks)
        self.wait.until(lambda current: current.find_element(*marks_locator).get_attribute("value") == marks)
        save_locator = (By.CSS_SELECTOR, f"[data-testid='save-result-{cadet_id}']")
        self.wait.until(lambda current: current.find_element(*save_locator).is_enabled())
        self.fill((By.CSS_SELECTOR, f"[data-testid='result-remarks-{cadet_id}']"), remarks)
        self.activate(save_locator)
        self.wait.until(EC.text_to_be_present_in_element(save_locator, "Saved"))

    def delete_result(self, result_id: int) -> None:
        button = self.clickable((By.CSS_SELECTOR, f"[data-testid='delete-result-{result_id}']"))
        self.driver.execute_script("window.confirm = () => true; arguments[0].click();", button)
        self.wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, f"[data-testid='delete-result-{result_id}']")))
