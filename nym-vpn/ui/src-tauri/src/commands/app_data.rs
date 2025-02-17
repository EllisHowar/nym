use tauri::State;
use tracing::{debug, instrument};

use crate::states::app::Country;
use crate::{
    error::{CmdError, CmdErrorSource},
    fs::data::{AppData, UiTheme},
    states::SharedAppData,
};

#[instrument]
#[tauri::command]
pub fn get_node_countries() -> Result<Vec<Country>, CmdError> {
    debug!("get_node_countries");
    let countries: Vec<Country> = vec![
        Country {
            name: "United States".to_string(),
            code: "US".to_string(),
        },
        Country {
            name: "France".to_string(),
            code: "FR".to_string(),
        },
        Country {
            name: "Switzerland".to_string(),
            code: "CH".to_string(),
        },
        Country {
            name: "Sweden".to_string(),
            code: "SE".to_string(),
        },
        Country {
            name: "Germany".to_string(),
            code: "DE".to_string(),
        },
    ];
    Ok(countries)
}

#[instrument(skip(state))]
#[tauri::command]
pub async fn set_app_data(
    state: State<'_, SharedAppData>,
    data: Option<AppData>,
) -> Result<(), CmdError> {
    debug!("set_app_data");
    let mut app_data_store = state.lock().await;
    if let Some(data) = data {
        app_data_store.data = data;
    }
    app_data_store
        .write()
        .await
        .map_err(|e| CmdError::new(CmdErrorSource::InternalError, e.to_string()))?;

    Ok(())
}

#[instrument(skip_all)]
#[tauri::command]
pub async fn get_app_data(
    state: State<'_, SharedAppData>,
    data: Option<AppData>,
) -> Result<AppData, CmdError> {
    debug!("get_app_data");
    let mut app_data_store = state.lock().await;
    if let Some(data) = data {
        app_data_store.data = data;
    }
    let data = app_data_store
        .read()
        .await
        .map_err(|e| CmdError::new(CmdErrorSource::InternalError, e.to_string()))?;

    Ok(data)
}

#[instrument(skip(data_state))]
#[tauri::command]
pub async fn set_ui_theme(
    data_state: State<'_, SharedAppData>,
    theme: UiTheme,
) -> Result<(), CmdError> {
    debug!("set_ui_theme");

    // save the selected UI theme to disk
    let mut app_data_store = data_state.lock().await;
    let mut app_data = app_data_store
        .read()
        .await
        .map_err(|e| CmdError::new(CmdErrorSource::InternalError, e.to_string()))?;
    app_data.ui_theme = Some(theme);
    app_data_store.data = app_data;
    app_data_store
        .write()
        .await
        .map_err(|e| CmdError::new(CmdErrorSource::InternalError, e.to_string()))?;
    Ok(())
}
