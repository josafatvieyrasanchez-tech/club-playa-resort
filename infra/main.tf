terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.117.1"
    }
  }
}

provider "azurerm" {
  features {}
}

# 1. Grupo de Recursos (Ya existe en East US)
resource "azurerm_resource_group" "rg" {
  name     = "rg-galdijo-resort"
  location = "eastus"
}

# 2. Servidor SQL (Ya existe en Mexico Central)
resource "azurerm_mssql_server" "sql_server" {
  name                         = "galdijoresortsql2026"
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = "mexicocentral"
  version                      = "12.0"
  

  administrator_login          = "galdijoadmin" 
  administrator_login_password = "Password1234!" 
  
  # AGREGA ESTO PARA QUE COINCIDA
  public_network_access_enabled = false 
}

# 3. Base de Datos (Ya existe)
resource "azurerm_mssql_database" "db_practica" {
  name      = "galdijodb"
  server_id = azurerm_mssql_server.sql_server.id
  sku_name  = "Basic"
  
  # Esta línea soluciona el error de "ProvisioningDisabled"
  storage_account_type = "Local" 
}

# 4. Plan de Servicio (Se crea en Mexico Central)
resource "azurerm_service_plan" "plan" {
  name                = "plan-club-playa"
  resource_group_name = azurerm_resource_group.rg.name
  location            = "mexicocentral"
  os_type             = "Linux"
  sku_name            = "B1" 
}

# 5. Web App (Se crea en Mexico Central)
resource "azurerm_linux_web_app" "webapp" {
  name                = "club-playa-resort-app-2026"
  resource_group_name = azurerm_resource_group.rg.name
  location            = "mexicocentral"
  service_plan_id     = azurerm_service_plan.plan.id

  site_config {
    application_stack {
      node_version = "18-lts"
    }
  }
}