import axios from 'axios';

const url = "http://localhost:3000/"

class PostService{
    //Get Posts
    // static getClasses(){
    //     return new Promise(async (resolve, rejects) => {
    //         try{
    //          const res = await axios.get(url)
    //          const data = res.data
    //          resolve(
    //              data.map(post => post)
    //          )
    //         }catch(err){
    //             rejects(err)
    //         }
    //     })
    // }


    // Get UserInfo
    static getUserInfo(){
        const token = window.localStorage.getItem("auth-token")
        return axios.get(`${url}users/user`,{ params:{}, headers: { 'auth-token': token } })
    }

    // Create a new class for the current user
    static createClass( classroomName){
        const email = "coolguys@gmail.com"
        if (classroomName != null && classroomName != ""){
            return axios.post(`${url}users/createclass`,{
                email,
                classroomName
            })
        }

    }

    // To join class
    static joinClass(code){
        const email = "coolguys@gmail.com"
        return axios.post(`${url}users/joinclass`, {
            email,
            code
        })
    }

    // Post Data for signing up
    static async signUp(email,pwd,name){
        return axios.post(`${url}auth/signUp`, {
            email,
            pwd,
            name
        })
    }

    static async login(email,pwd){
        const credential = await axios.post(`${url}auth/login`,{
            email,
            pwd
        })
        const {token} = credential.data
        if (token){
            window.localStorage.setItem("auth-token",token)
            window.location.replace("/home")
            return null
        }else{
            return {"message" : credential.data.message}
        }
    }

}

export default PostService;