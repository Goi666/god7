import React from 'react';
import logo from './logo.svg';
import './App.css';
import Modal from 'react-modal';
import CardSet from './components/CardSet';
import Reset from './components/Reset';
import Correct from './components/Correct';
import Misstake from './components/Misstake';
import Connect from './components/App';

import { createStore } from 'redux';
import { Provider, connect, ReactReduxContext } from 'react-redux';
import rootReducer from './reducers/Auth';

import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import MyPage from './components/MyPage';
import Ranking from './components/Ranking';

import firebase from 'firebase';
import { firebaseDb } from './firebase/index';
import authcontainer from './containers/AuthContainer';


const users = firebaseDb.collection('users');

const store = createStore(
  rootReducer
);


const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};

// Make sure to bind modal to your appElement (http://reactcommunity.org/react-modal/accessibility/)
//Modal.setAppElement('#App')

//Store 状態確認
store.subscribe(() => {
  console.log("App.js Store Check",store.getState());
});




function App() {
  return (
    <Router>
      <Provider store={store}>
        <div className="App">
          <header className="App-header">
            <Connect />
          </header>
          <Route exact path="/" component={MainContents} />
          <Route path="/mypage"
            render={() => <MyPage data={store.getState()} /> } />
          <Route path="/ranking" component={Ranking} />
        </div>
      </Provider>
    </Router>
  );
}

class MainContents extends React.Component {
  constructor(props){
    super(props);
    console.log("MainContents store", store.getState());
  console.log("MainContents props",this.props);
  }
  render(){
    return(
      <div className="App-contents">
        <p>オープン7とは...<br />
        めくったカードの数字が次にめくれるカードの場所となる！<br />
        最後までめくれたら勝利！！さあ、挑戦してみよう！</p>
        <CardList data={this.props}/>
      </div>
    );
  }
}


class CardList extends React.Component {
  constructor(props){
    let uid = store.getState().uid;
    if (!uid) {
      let uid = "";
    }
    super(props);
    this.state = {
      card_check: '0',
      card_value: '',
      select_card: [],
      check_cards: ['1','2','3','4','5','6','7'],
      result: '0',
      modalIsOpen: false,
      uid: uid
    }
    console.log("CardList props",this.props);

    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    window.addEventListener("orientationchange", function() {
        let orientation = window.orientation;

        if (orientation === 0) {
            /*  縦画面時の処理  */
           const popup = document.getElementById('js-popup');
           if(!popup) return;
           popup.classList.add('is-show');
        } else {
            let popup = document.getElementById('js-popup');
            popup.classList.remove('is-show');
        }
    });
  }
    openModal() {
    this.setState({modalIsOpen: true});
  }

  afterOpenModal() {
    // references are now sync'd and can be accessed.
    this.subtitle.style.color = '#f00';
  }

  closeModal() {
    this.setState({modalIsOpen: false});
  }


  // start setting...
  componentWillMount(){
    this.pageCheck();
    this.shuffleCards();
  }

  // Vertical or Side
  pageCheck = () => {
    //画面の向きを 0,90,180,-90 のいずれかで取得
    let orientation = window.orientation;

    window.onload = function(){
      if (orientation === 0) {
          /*  縦画面時の処理  */
          const  popup = document.getElementById('js-popup');
          if(!popup) return;
          popup.classList.add('is-show');
      } else {
          /*  横画面時の処理  */
      }
    }
  }

  //state reset...
  stateReset = () => {
    this.setState({select_card: []});
    this.setState({check_cards: []});
    this.setState({result: '0'});
    this.shuffleCards();
    this.cardsReset();
    this.closeModal();
  }

  cardsReset = () => {
    let cards = document.getElementById("CardList").getElementsByClassName("cardslist");
    for(let i = 0; i < cards.length; i++){
      cards[i].disabled = false;
      cards[i].classList.remove("selectCard");
      cards[i].classList.add("cards");
      cards[i].src = "/images/tramp_back.png";
    }
  }

  shuffleCards = () => {
    const array = Object.assign([], this.state.check_cards);
    for(let i = array.length - 1; i > 0; i--){
      const r = Math.floor(Math.random() * (i + 1));
      const tmp = array[i];
      array[i] = array[r];
      array[r] = tmp;
    }
    this.setState({ check_cards: array});
  }


  handleFunction = (card, index) => {
    this.changeImage(card, index);
    this.handleOnClick(card, index);
  }

  handleOnClick = (e, index) => {
    this.setState({card_value: e});
    const card = Object.assign([], this.state.select_card);
    card.push(e);
    this.setState({ select_card: card });

    this.openCheck(e, index);
  }

  openCheck = (card, index) => {
    let openedCard = this.state.select_card
    if(openedCard.length == 6 && openedCard.indexOf(card) == '-1') {
      //正解
      this.setState({result: '1'});
      this.AddFirestore("1");
      this.cardsAllBlock();
      this.openModal();
    }else if(openedCard.indexOf(card) != '-1') {
      //不正解
      this.setState({result: '2'});
      this.AddFirestore("2");
      this.cardsAllBlock();
      this.openModal();
    }else{
      this.cardBlock(openedCard, card, index);
    }
  }

  cardBlock = (openedCard, card, index) => {
    let selectItem = document.getElementById("CardList").getElementsByClassName("cardslist");
    for(let i = 0; i < selectItem.length; i++){
      selectItem[i].disabled = true;
      selectItem[i].classList.remove("selectCard");
      selectItem[i].classList.add("cards");
    }
    let select_cards = openedCard;
    select_cards.push(card);

    if(card == 4) {
      selectItem[3].disabled = false;
      selectItem[3].classList.remove("cards");
      selectItem[3].classList.add("selectCard");
    } else {
      //left select
      selectItem[card - 1].disabled = false;
      selectItem[3].classList.remove("cards");
      selectItem[card - 1].classList.add("selectCard");

      //right select
      selectItem[7 - card].disabled = false;
      selectItem[7 - card].classList.remove("cards");
      selectItem[7 - card].classList.add("selectCard");
    }

    const array = this.state.check_cards;
    let target = array[card - 1];
    let an_target = array[7 - card];

    if(select_cards.indexOf(target) != '-1' && select_cards.indexOf(an_target) != '-1'){
      //不正解
      this.setState({result: '2'});
      this.AddFirestore("2");
      this.cardsAllBlock();
      this.openModal();
    }
  }

  changeImage = (card, index) => {
    let selectItem = document.getElementById("CardList").getElementsByClassName("cardslist");
    selectItem[index].src = "/images/ace0" + card + ".gif";
  }

  cardsAllBlock = () => {
    let selectItem = document.getElementById("CardList").getElementsByClassName("cardslist");
    for(let i = 0; i < selectItem.length; i++){
      selectItem[i].disabled = true;
      selectItem[i].classList.remove("selectCard");
      selectItem[i].classList.add("cards");
    }
  }

  AddFirestore = (result) => {
    let uid = this.state.uid;
    console.log("uid",uid);
    console.log("AddFirestore...");
    if (uid != "" && uid != null) {
      console.log("AddFirestore res",result)
      let citiesRef = firebaseDb.collection('users');
      let query = citiesRef.where('uid', '==', uid).get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            console.log("doc", doc);
            console.log("doc id", doc.id);
            const user = doc.data();
            console.log("doc data", user);

            const game = user.game;
            const win = user.win;
            const lose = user.lose;

            users.doc(doc.id).set({
              game: game + 1
            }, {merge: true});
            if (result == "1") {
              users.doc(doc.id).set({
                win: win + 1
              }, {merge: true});
            } else if (result == "2") {
              users.doc(doc.id).set({
                lose: lose + 1
              }, {merge: true});
            }
          });
        })
      .catch(err => {
        console.log('Error getting documents',err);
      })
    }
  }

  render() {
    return (
      <div className="CardBox">
        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="Example Modal"
        >
          <h2 ref={subtitle => this.subtitle = subtitle}></h2>
          {this.state.result == 1 ? <Correct /> : <Misstake />}
          {this.state.result != '0' ? <Reset stateReset={this.stateReset} /> : ''}
        </Modal>
        <div className="popup" id="js-popup">
          <div className="popup-inner">
            <a href="#"><img src={process.env.PUBLIC_URL +"/images/phone.png"} alt="ポップアップ画像" /></a>
          </div>
          <div className="black-background" id="js-black-bg"></div>
        </div>

        <div id="CardList" className="card_list">
          <ul>
            <CardSet  cardClick={this.handleFunction} cardList={this.state.check_cards} />
          </ul>
        </div>
          {this.state.result != '0' ? <Reset stateReset={this.stateReset} /> : ''}
      </div>
    );
  }
}


export default App;
