"""Non-destructive local regression check for the gap-closure dashboards and routes."""
import os

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait


BASE_URL = os.getenv("LOCAL_UI_BASE_URL", "http://127.0.0.1:5173")


def login(driver, email, destination):
    driver.get(BASE_URL)
    wait = WebDriverWait(driver, 25)
    wait.until(lambda current: current.find_element(By.CSS_SELECTOR, "[data-testid='login-email']"))
    driver.find_element(By.CSS_SELECTOR, "[data-testid='login-email']").send_keys(email)
    driver.find_element(By.CSS_SELECTOR, "[data-testid='login-password']").send_keys("password123")
    submit = driver.find_element(By.CSS_SELECTOR, "[data-testid='login-submit']")
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", submit)
    driver.execute_script("arguments[0].click();", submit)
    wait.until(lambda current: current.current_url == f"{BASE_URL}{destination}")
    return wait


def run():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1200")
    driver = webdriver.Chrome(options=options)
    try:
        wait = login(driver, "commander@commander.com", "/commander")
        wait.until(lambda current: "Command operations" in current.page_source and "Alerts and exceptions" in current.page_source)

        driver.execute_script("localStorage.clear()")
        wait = login(driver, "admin@admin.com", "/admin")
        wait.until(lambda current: "Admin dashboard" in current.page_source and "Cadet roster" in current.page_source)
        driver.get(f"{BASE_URL}/reports")
        wait.until(lambda current: "Individual cadet report" in current.page_source)

        driver.execute_script("localStorage.clear()")
        wait = login(driver, "cadet@cadet.com", "/cadet")
        wait.until(lambda current: "Academic average" in current.page_source and "Physicals accepted" in current.page_source)
        driver.get(f"{BASE_URL}/physical")
        wait.until(lambda current: "Submit Training Video" in current.page_source and "Submission history" in current.page_source)

        driver.execute_script("localStorage.clear()")
        driver.set_window_size(390, 844)
        wait = login(driver, "cadet@cadet.com", "/cadet")
        wait.until(lambda current: "Your training progress" in current.page_source)
        if driver.execute_script("return document.documentElement.scrollWidth > window.innerWidth + 1"):
            raise AssertionError("Cadet dashboard has horizontal overflow at 390px width")
        print("PASS: Commander, Admin, Cadet, reports, physical training, and mobile dashboard UI checks succeeded.")
    finally:
        driver.quit()


if __name__ == "__main__":
    run()
