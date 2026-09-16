from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from .base_page import BasePage


class AttendancePage(BasePage):
    def create_and_mark_present(self, subject_id: int, cadet_name: str) -> None:
        self.open("/attendance")
        self.visible((By.CSS_SELECTOR, "[data-testid='attendance-subject']"))
        subject_selector = (By.CSS_SELECTOR, "[data-testid='attendance-subject']")
        # Subjects are fetched after the panel mounts; wait for the requested
        # option instead of selecting the temporary placeholder list.
        self.wait.until(
            lambda current: any(
                option.get_attribute("value") == str(subject_id)
                for option in current.find_element(*subject_selector).find_elements(By.TAG_NAME, "option")
            )
        )
        Select(self.driver.find_element(*subject_selector)).select_by_value(str(subject_id))
        self.wait.until(lambda current: cadet_name in current.page_source)
        self.activate((By.CSS_SELECTOR, "[data-testid='create-attendance-session']"))
        self.wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "[data-testid='attendance-message']"), "Session created."))
        self.activate((By.CSS_SELECTOR, f"[aria-label='Mark {cadet_name} present']"))
        self.activate((By.CSS_SELECTOR, "[data-testid='save-attendance']"))
        self.wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "[data-testid='attendance-message']"), "Attendance saved"))
