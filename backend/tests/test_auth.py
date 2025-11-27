"""
Authentication API Unit Tests
Tests for JWT authentication system
"""
import pytest
import sys
import os
import uuid

# Backend modülünü import için path ekle
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app


@pytest.fixture(scope="module")
def client():
    """Test client fixture"""
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def test_user_data():
    """Test user data fixture - unique for each test run"""
    unique_id = uuid.uuid4().hex[:8]
    return {
        "email": f"test_{unique_id}@example.com",
        "username": f"testuser_{unique_id}",
        "password": "TestPassword123!",
        "name": f"Test User {unique_id}"
    }


@pytest.fixture(scope="module")
def registered_user(client, test_user_data):
    """Register a user and return the response data"""
    response = client.post("/api/auth/register", json={
        "email": test_user_data["email"],
        "password": test_user_data["password"],
        "name": test_user_data["name"]
    })
    assert response.status_code == 201
    return {
        **test_user_data,
        "tokens": response.json()
    }


class TestUserRegistration:
    """Test cases for user registration endpoint"""
    
    def test_register_new_user_success(self, client):
        """Test successful user registration"""
        unique_id = uuid.uuid4().hex[:8]
        response = client.post("/api/auth/register", json={
            "email": f"newuser_{unique_id}@example.com",
            "password": "SecurePass123!",
            "name": "New User"
        })
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_register_duplicate_email(self, client, registered_user):
        """Test registration with duplicate email fails"""
        response = client.post("/api/auth/register", json={
            "email": registered_user["email"],
            "password": "AnotherPass123!",
            "name": "Duplicate User"
        })
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email format"""
        response = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "TestPassword123!",
            "name": "Invalid Email User"
        })
        assert response.status_code == 422  # Validation error


class TestUserLogin:
    """Test cases for user login endpoint"""
    
    def test_login_success(self, client, registered_user):
        """Test successful login with JSON body"""
        response = client.post("/api/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, client, registered_user):
        """Test login with wrong password fails"""
        response = client.post("/api/auth/login", json={
            "email": registered_user["email"],
            "password": "WrongPassword123!"
        })
        assert response.status_code == 401
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user fails"""
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        })
        assert response.status_code == 401


class TestTokenRefresh:
    """Test cases for token refresh endpoint"""
    
    def test_refresh_token_success(self, client, registered_user):
        """Test token refresh with valid refresh token"""
        refresh_token = registered_user["tokens"]["refresh_token"]
        
        # Refresh the token - check API expects query param or body
        response = client.post(
            "/api/auth/refresh",
            params={"refresh_token": refresh_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
    
    def test_refresh_token_invalid(self, client):
        """Test token refresh with invalid token fails"""
        response = client.post(
            "/api/auth/refresh",
            params={"refresh_token": "invalid_token"}
        )
        assert response.status_code == 401


class TestProtectedEndpoints:
    """Test cases for protected endpoints"""
    
    def test_get_current_user_authenticated(self, client, registered_user):
        """Test getting current user info when authenticated"""
        access_token = registered_user["tokens"]["access_token"]
        
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == registered_user["email"]
    
    def test_get_current_user_unauthorized(self, client):
        """Test getting current user without auth fails"""
        response = client.get("/api/auth/me")
        # Could be 401 or 403 depending on implementation
        assert response.status_code in [401, 403]
    
    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token fails"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code in [401, 403]


class TestPasswordChange:
    """Test cases for password change endpoint"""
    
    def test_change_password_success(self, client):
        """Test successful password change"""
        # Create a new user for this test
        unique_id = uuid.uuid4().hex[:8]
        reg_response = client.post("/api/auth/register", json={
            "email": f"pwchange_{unique_id}@example.com",
            "password": "OldPassword123!",
            "name": "Password Change User"
        })
        assert reg_response.status_code == 201
        access_token = reg_response.json()["access_token"]
        
        # Change password
        new_password = "NewPassword456!"
        response = client.post(
            "/api/auth/change-password",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "current_password": "OldPassword123!",
                "new_password": new_password
            }
        )
        assert response.status_code == 200
        
        # Verify can login with new password
        login_response = client.post("/api/auth/login", json={
            "email": f"pwchange_{unique_id}@example.com",
            "password": new_password
        })
        assert login_response.status_code == 200
    
    def test_change_password_wrong_current(self, client, registered_user):
        """Test password change with wrong current password fails"""
        access_token = registered_user["tokens"]["access_token"]
        
        response = client.post(
            "/api/auth/change-password",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "current_password": "WrongCurrentPassword!",
                "new_password": "NewPassword123!"
            }
        )
        assert response.status_code == 400


class TestUsageStats:
    """Test cases for usage statistics endpoint"""
    
    def test_get_usage_stats_authenticated(self, client, registered_user):
        """Test getting usage stats when authenticated"""
        access_token = registered_user["tokens"]["access_token"]
        
        response = client.get(
            "/api/auth/usage",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "plan" in data
        assert "usage" in data


class TestLogout:
    """Test cases for logout endpoint"""
    
    def test_logout_success(self, client, registered_user):
        """Test successful logout"""
        access_token = registered_user["tokens"]["access_token"]
        
        response = client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == 200
        assert "message" in response.json()
