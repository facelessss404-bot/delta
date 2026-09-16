from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select

from .base_page import BasePage


class NoticeBoardPage(BasePage):
    def publish_urgent(self, title: str, content: str) -> None:
        self.open("/notices")
        self.activate((By.XPATH, "//button[contains(., 'Post notice')]"))
        self.fill((By.CSS_SELECTOR, "input[placeholder='Notice title']"), title)
        priority_selector = (By.CSS_SELECTOR, "input[placeholder='Notice title'] + select")
        self.wait.until(
            lambda current: any(
                option.get_attribute("value") == "urgent"
                for option in current.find_element(*priority_selector).find_elements(By.TAG_NAME, "option")
            )
        )
        Select(self.driver.find_element(*priority_selector)).select_by_value("urgent")
        self.fill((By.CSS_SELECTOR, "textarea[placeholder='Write the announcement...']"), content)
        self.activate((By.XPATH, "//button[normalize-space()='Publish notice']"))
        # The title is already present in the input, so wait for the successful
        # submission to close the form before accepting the rendered notice.
        self.wait.until(
            lambda current: not current.find_elements(By.CSS_SELECTOR, "input[placeholder='Notice title']")
        )
        self.wait.until(lambda current: title in current.page_source)


class LeavePage(BasePage):
    def request_leave(self, start_date: str, end_date: str, reason: str) -> None:
        self.open("/leaves")
        self.activate((By.XPATH, "//button[contains(., 'Request leave')]"))
        self.fill((By.XPATH, "(//input[@type='date'])[1]"), start_date)
        self.fill((By.XPATH, "(//input[@type='date'])[2]"), end_date)
        self.fill((By.CSS_SELECTOR, "textarea[placeholder='Detailed reason for leave request...']"), reason)
        self.activate((By.XPATH, "//button[normalize-space()='Submit Request']"))
        self.wait.until(lambda current: not current.find_elements(By.CSS_SELECTOR, "input[type='date']"))
        self.wait.until(lambda current: reason in current.page_source)

    def approve_leave(self, reason: str) -> None:
        self.open("/leaves")
        self.wait.until(lambda current: reason in current.page_source)
        approval = self.clickable((By.XPATH, f"//p[normalize-space()={reason!r}]/ancestor::article//button[contains(., 'Approve')]"))
        # Headless Chromium suppresses modal prompts. Stub only the optional
        # browser prompt value, then invoke the application's real handler.
        self.driver.execute_script("window.prompt = () => arguments[1]; arguments[0].click();", approval, "Verified by automated E2E")
        self.wait.until(lambda current: "approved" in current.page_source.lower())


class SettingsPage(BasePage):
    def disable_email_notifications(self) -> None:
        self.open("/settings")
        checkbox = self.visible((By.CSS_SELECTOR, "input[type='checkbox']"))
        if checkbox.is_selected():
            self.driver.execute_script("arguments[0].click();", checkbox)
        self.activate((By.XPATH, "//button[normalize-space()='Save preferences']"))
        self.wait.until(lambda current: "/settings" in current.current_url)
