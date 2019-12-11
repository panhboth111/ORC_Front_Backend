import axios from 'axios';


const url = "http://localhost:3000/users/"

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


    // Get All Classes form DB
    static getClasses(){
        const email = "coolguys@gmail.com"
        return axios.post(`${url}class`, {
            email
        })
    }

    // Create a new class for the current user
    static createClass( classroomName){
        const email = "coolguys@gmail.com"
        if (classroomName != null && classroomName != ""){
            return axios.post(`${url}createclass`,{
                email,
                classroomName
            })
        }

    }

    // Post Data for signing up
    static signUp(email,pwd,name){
        email = "coolguys@gmail.com"
        return axios.post(`${url}signUp`, {
            email,
            pwd,
            name
        })
    }
}

export default PostService;