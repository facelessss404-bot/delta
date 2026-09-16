from __future__ import annotations

from pathlib import Path

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from tests.config import Settings
from tests.utils.db_helper import DbHelper
from tests.utils.screenshots import save_screenshot
from tests.utils.test_data import TestData


def pytest_configure(config):
    for directory in ("screenshots", "test-results", "reports", "logs"):
        Path(directory).mkdir(exist_ok=True)


@pytest.fixture(scope="session")
def settings():
    settings = Settings.from_env()
    problem = settings.safety_problem()
    if problem:
        pytest.skip(f"E2E suite not started safely: {problem}")
    return settings


@pytest.fixture(scope="session")
def run_context(settings):
    db = DbHelper(settings.database_url, settings.expected_schema or None)
    actual_name = db.scalar("SELECT current_database()")
    if actual_name != settings.expected_database_name:
        db.close()
        pytest.skip("E2E suite not started: TEST_DATABASE_EXPECTED_NAME does not match PostgreSQL current_database().")
    if settings.expected_schema and db.scalar("SELECT current_schema()") != settings.expected_schema:
        db.close()
        pytest.skip("E2E suite not started: TEST_DATABASE_EXPECTED_SCHEMA does not match PostgreSQL current_schema().")
    context = {"settings": settings, "db": db, "data": TestData.create()}
    yield context
    try:
        db.cleanup_run(context["data"].run_id)
    finally:
        db.close()


@pytest.fixture
def driver(request, settings):
    options = Options()
    if settings.chrome_binary:
        options.binary_location = settings.chrome_binary
    if settings.headless:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1200")
    options.add_argument("--disable-notifications")
    browser = webdriver.Chrome(options=options)
    browser.implicitly_wait(0)
    request.node.selenium_driver = browser
    yield browser
    browser.quit()


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == "call" and report.failed and (browser := getattr(item, "selenium_driver", None)):
        report.user_properties.append(("screenshot", str(save_screenshot(browser, item.nodeid))))
