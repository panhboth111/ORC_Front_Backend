function auth (){
    const auth_token = window.localStorage.getItem("auth-token")
    if (auth_token){
        if (window.location.pathname == "/login"){
            window.location.replace("/home")
        } 
    }else{
        if (window.location.pathname != "/login"){
            window.location.replace("/login")
        }
    }
}

export default auth;