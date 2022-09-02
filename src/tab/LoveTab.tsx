import React, {useState, useEffect} from 'react'
import {SafeAreaView, StyleSheet, Text, View, ScrollView} from 'react-native'
import Colors from '../utils/Colors'
import * as Animatable from 'react-native-animatable'
import {auth} from '../firebase/firebase-config'
import {Button} from '../utils/CustomComponents'
import FastImage from 'react-native-fast-image'
import {useAppSelector} from '../hooks/redux.hook'
import {UserType} from '../models/user.model'
import {intervalToDuration} from 'date-fns'

const delay = [0, 400, 1200, 900, 300, 500]
const iterationDelay = [0, 100, 50, 120, 10, 80]
const timeDefinitions = ['Year', 'Month', 'Day', 'Hour', 'Min', 'Sec']

const loveBegin = new Date('2018-07-23T12:00:00Z')

const LoveTab: React.FC = () => {
	console.log('render LoveTab')

	const users: UserType[] = useAppSelector(state => state.usersReducer)

	const user = users.find(user_item =>
		auth.currentUser ? user_item.email == auth.currentUser.email : 'buivantoanbg2001@gmail.com',
	)
	const user_lover = users.find(user_item =>
		auth.currentUser ? user_item.email != auth.currentUser.email : 'linhngocbh2001@gmail.com',
	)

	if (user == null || user_lover == null) return <></>

	return (
		<SafeAreaView style={styles.container}>
			<FastImage source={require('../../assets/images/heart_fly.gif')} style={styles.background} />

			<ScrollView style={{marginTop: 45}}>
				<Animatable.Text
					animation="pulse"
					iterationCount="infinite"
					duration={2000}
					useNativeDriver={true}
					style={styles.title}>
					Two pandas have been the couple for...
				</Animatable.Text>

				<LoveTime />

				<View style={styles.infoWrapper}>
					<InfoUser user={user} />
					<FastImage
						source={require('../../assets/images/love_line.gif')}
						style={{width: 110, height: 90}}
						resizeMode={FastImage.resizeMode.contain}
					/>
					<InfoUser user={user_lover} />
				</View>

				<FastImage
					source={require('../../assets/images/couple.gif')}
					style={{width: 170, height: 150, alignSelf: 'center'}}
					resizeMode={FastImage.resizeMode.contain}
				/>
			</ScrollView>
		</SafeAreaView>
	)
}

const LoveTime: React.FC = () => {
	console.log('render LoveTime')

	const [loveTime, setLoveTime] = useState(() => {
		const duration = intervalToDuration({
			start: loveBegin,
			end: new Date(),
		})

		return [
			duration.years || 0,
			duration.months || 0,
			duration.days || 0,
			duration.hours || 0,
			duration.minutes || 0,
			duration.seconds || 0,
		]
	})

	useEffect(() => {
		const interval = setInterval(() => computeLoveTime(), 1000)
		return () => clearInterval(interval)
	}, [])

	const computeLoveTime = () => {
		const duration = intervalToDuration({
			start: loveBegin,
			end: new Date(),
		})

		setLoveTime([
			duration.years || 0,
			duration.months || 0,
			duration.days || 0,
			duration.hours || 0,
			duration.minutes || 0,
			duration.seconds || 0,
		])
	}

	return (
		<View style={styles.loveTimeContainer}>
			{loveTime.map((time, index) => (
				<Animatable.View
					key={index}
					animation="short-slide-in-down"
					iterationCount="infinite"
					direction="alternate"
					delay={delay[index]}
					iterationDelay={iterationDelay[index]}
					useNativeDriver={true}>
					<View style={{alignItems: 'center', justifyContent: 'center'}}>
						<Animatable.Image
							animation="flash"
							iterationCount="infinite"
							direction="alternate"
							delay={delay[index]}
							duration={1500}
							useNativeDriver={true}
							source={require('../../assets/images/ic_love_anniversary.png')}
							style={{width: 48, height: 48, resizeMode: 'contain'}}
						/>
						<View style={{position: 'absolute', top: 12}}>
							<Text style={styles.text}>{time}</Text>
						</View>
					</View>
					<Text style={styles.normalText}>{timeDefinitions[index] + (time > 1 ? 's' : '')}</Text>
				</Animatable.View>
			))}
		</View>
	)
}

type InfoUserProps = {
	user: {
		email: string
		username: string
		avatar_url: string
	}
}

const InfoUser = ({user}: InfoUserProps) => {
	return (
		<View style={{alignItems: 'center'}}>
			<View style={styles.avatar}>
				<Button
					activeOpacity={1}
					iconStyle={styles.pictureProfile}
					source={{
						uri: user.avatar_url,
					}}
					style={styles.pictureProfileWrapper}
				/>
			</View>
			<Animatable.Text
				animation="pulse"
				iterationCount="infinite"
				direction="alternate"
				useNativeDriver={true}
				style={styles.textInfo}>
				{user.username}
			</Animatable.Text>
		</View>
	)
}

export default LoveTab

const styles = StyleSheet.create({
	container: {
		backgroundColor: Colors.lychee,
		flex: 1,
	},
	background: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
		position: 'absolute',
		bottom: 0,
	},
	title: {
		color: Colors.lychee,
		fontFamily: 'Romantically',
		fontSize: 18,
		textAlign: 'center',
		width: '90%',
		alignSelf: 'center',
	},
	infoWrapper: {
		width: '100%',
		flexDirection: 'row',
		flex: 1,
		justifyContent: 'center',
		marginTop: 20,
	},
	textInfo: {
		color: Colors.lychee,
		fontFamily: 'CoffeeLatte-Regular',
		fontSize: 22,
	},
	avatar: {
		padding: 3,
		borderWidth: 1.6,
		borderColor: Colors.lychee,
		borderRadius: 100,
	},
	pictureProfile: {
		width: 90,
		height: 90,
		borderRadius: 100,
	},
	pictureProfileWrapper: {
		marginHorizontal: 0,
	},
	loveTimeContainer: {
		flexDirection: 'row',
		marginVertical: 45,
		justifyContent: 'space-between',
		paddingHorizontal: 20,
	},
	text: {
		color: Colors.lychee,
		fontFamily: 'CoffeeLatte-Regular',
		fontSize: 22,
	},
	normalText: {
		color: Colors.gray,
		fontFamily: 'CoffeeLatte-Regular',
		fontSize: 12,
		alignSelf: 'center',
	},
})
