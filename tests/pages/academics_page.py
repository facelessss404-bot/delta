from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from .base_page import BasePage


class AcademicsPage(BasePage):
    def create_assessment_and_mark(self, subject_id: int, title: str, cadet_id: int, marks: str) -> None:
        self.open("/academics")
        subject = (By.XPATH, "//h2[normalize-space()='New assessment']/following::select[1]")
        self.visible(subject)
        Select(self.driver.find_element(*subject)).select_by_value(str(subject_id))
        self.fill((By.CSS_SELECTOR, "input[placeholder='Assessment title']"), title)
        self.fill((By.CSS_SELECTOR, "input[placeholder='Maximum marks']"), "100")
        self.activate((By.XPATH, "//button[normalize-space()='Create assessment']"))
        self.wait.until(lambda current: "Assessment created." in current.page_source)
        assessment = (By.XPATH, "//h2[normalize-space()='Enter or correct mark']/following::select[1]")
        cadet = (By.XPATH, "//h2[normalize-space()='Enter or correct mark']/following::select[2]")
        self.wait.until(lambda current: any(option.text.startswith(title + " (") for option in current.find_element(*assessment).find_elements(By.TAG_NAME, "option")))
        assessment_option = next(option for option in self.driver.find_element(*assessment).find_elements(By.TAG_NAME, "option") if option.text.startswith(title + " ("))
        Select(self.driver.find_element(*assessment)).select_by_value(assessment_option.get_attribute("value"))
        Select(self.driver.find_element(*cadet)).select_by_value(str(cadet_id))
        self.fill((By.CSS_SELECTOR, "input[placeholder='Marks obtained']"), marks)
        self.activate((By.XPATH, "//button[normalize-space()='Save mark']"))
        self.wait.until(lambda current: "Mark saved with an audit entry." in current.page_source)
