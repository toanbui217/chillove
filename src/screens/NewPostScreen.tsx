import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {
	StyleSheet,
	View,
	SafeAreaView,
	ScrollView,
	Image,
	TouchableOpacity,
	TextInput,
	FlatList,
	Switch,
	Dimensions,
	Platform,
	Text,
} from 'react-native'
import Colors from '../utils/Colors'
import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker'
import {Button, CustomText, CustomTextInput} from '../utils/CustomComponents'
import Icon, {Icons} from '../utils/Icons'
import * as Animatable from 'react-native-animatable'
import {useNavigation} from '@react-navigation/native'
import {
	storage,
	ref,
	uploadBytes,
	getDownloadURL,
	db,
	auth,
	collection,
	serverTimestamp,
	doc,
	setDoc,
	UploadResult,
} from '../firebase/firebase-config'
import uuid from 'react-native-uuid'
import useHighlightHashtag from '../hooks/useHighlightHashtag.hook'
import Toast from '../utils/Toast'

const {width} = Dimensions.get('window')
const PADDING = 16
const MARGIN = 24

type Props = {}

type Message = {
	id: string
	content: string
	type?: {
		success?: boolean
		error?: boolean
	}
}

const NewPostScreen = (props: Props) => {
	const [caption, setCaption] = useState<string>('')
	const [postImages, setPostImages] = useState<ImageOrVideo[]>([])
	const [privatePost, setPrivatePost] = useState<boolean>(false)
	const [messages, setMessages] = useState<Message[]>([])
	const navigation = useNavigation()

	const addToast = (message: Message) => {
		setMessages(messages => [...messages, message])
	}

	const removeToast = (message: Message) => {
		setMessages(messages => messages.filter(current => current.id !== message.id))
	}

	const regexHashtag = /^#[0-9a-z_]*[0-9a-z]+[0-9a-z_]*$/g

	const highlightHashtag = () => <>{useHighlightHashtag(caption)}</>

	const addNewPost = async () => {
		const hashtagSet = [
			...new Set(
				caption
					.split('\n')
					.map((line, index) => line.split(' ').filter((item, index) => item.match(regexHashtag)))
					.flat(Infinity),
			),
		]

		let promises: Promise<UploadResult>[] = []
		for (let i = 0; i < postImages.length; i++) {
			const imageRef = ref(storage, uuid.v4().toString())
			const image = await fetch(postImages[i].path)
			const blob = await image.blob()
			promises.push(uploadBytes(imageRef, blob))
		}
		Promise.all(promises)
			.then(snapshots => {
				let promises: Promise<string>[] = []
				snapshots.map((snap, index) => {
					promises.push(getDownloadURL(snap.ref))
				})
				Promise.all(promises)
					.then(downloadURLs => {
						var images: string[] = downloadURLs
						images = downloadURLs
						const docRef = doc(collection(db, 'posts'))
						if (auth.currentUser) {
							setDoc(docRef, {
								images: images,
								owner_email: auth.currentUser.email,
								is_private: privatePost,
								caption: caption,
								created_at: serverTimestamp(),
								comments: [],
								hashtags: hashtagSet,
							}).then(() => {
								console.log('Add new post successfully')
								addToast({
									id: uuid.v4().toString(),
									content: 'Add new post successfully',
									type: {success: true},
								})
								// setTimeout(() => navigation.goBack(), 4000)
							})
						} else {
							/**
							 * @todo showToast("Post failed")
							 */
						}
					})
					.catch(error => {
						console.log('Error', error.message)
						/**
						 * @todo showToast("Post failed")
						 */
					})
			})
			.catch(error => {
				console.log('Error', error.message)
				/**
				 * @todo showToast("Post failed")
				 */
			})
	}

	const goBack = () => {
		/**
		 * @todo Warning the current post will be not saved
		 * @success navigation.goBack();
		 * @error Do not do anything
		 */
	}

	const openGallery = () => {
		ImagePicker.openPicker({
			// mediaType: 'any',
			mediaType: 'photo',
			multiple: true,
		})
			.then(images => {
				if (images != null) {
					setPostImages(images)
				}
			})
			.catch(e => {
				console.log('Error code', e.code)

				if (e.code == 'E_PICKER_CANCELLED') {
					setPostImages([])
				}
			})
	}

	return (
		<SafeAreaView style={styles.container}>
			<Animatable.Image
				source={{
					uri: 'https://i.imgur.com/obASxu0.jpg',
				}}
				style={StyleSheet.absoluteFillObject}
				blurRadius={50}
				animation="rotate"
				iterationCount="infinite"
				easing={'linear'}
				duration={60000}
				useNativeDriver={true}
				resizeMode={'cover'}
			/>
			<Header addNewPost={addNewPost} goBack={goBack} />
			<ScrollView keyboardShouldPersistTaps={'handled'} nestedScrollEnabled>
				<Animatable.View
					style={styles.elementContainer}
					animation={'fadeInUp'}
					duration={500}
					useNativeDriver={true}>
					<View style={styles.elementHeader}>
						<Icon
							type={Icons.Ionicons}
							name="document-text-outline"
							size={14}
							color={Colors.black}
						/>
						<CustomText style={styles.elementTitle}>Caption</CustomText>
					</View>

					<CustomTextInput
						style={styles.caption}
						placeholder=" ... I❤U ... "
						multiline
						onChangeText={text => setCaption(text)}>
						{highlightHashtag()}
					</CustomTextInput>
				</Animatable.View>

				<Animatable.View
					style={[
						styles.elementContainer,
						{
							width: width - MARGIN,
							marginRight: 0,
							paddingRight: 0,
							borderTopRightRadius: 0,
							borderBottomRightRadius: 0,
						},
					]}
					animation={'fadeInUp'}
					duration={500}
					delay={150}
					useNativeDriver={true}>
					<View style={styles.elementHeader}>
						<Icon type={Icons.Ionicons} name="camera-outline" size={14} color={Colors.black} />
						<CustomText style={styles.elementTitle}>Add Photos/Videos</CustomText>
					</View>

					<View style={styles.paginationNumber}>
						<CustomText style={styles.imagePostCount}>
							{postImages.length}
							<CustomText style={{fontSize: 8}}> / {23}</CustomText>
						</CustomText>
					</View>

					<View style={{marginTop: 16, flexDirection: 'row', alignItems: 'center'}}>
						<TouchableOpacity style={styles.openGalleryButton} onPress={openGallery}>
							<Icon
								type={Icons.Ionicons}
								name="camera-outline"
								size={36}
								color={Colors.grape_fruit}
							/>
						</TouchableOpacity>
						<FlatList
							contentContainerStyle={{
								paddingRight: MARGIN - 4,
								paddingLeft: PADDING - 8 - 4,
							}}
							horizontal
							data={postImages}
							renderItem={({item}) => <Image source={{uri: item.path}} style={styles.postImage} />}
							keyExtractor={(item, index) => index.toString()}
							initialNumToRender={24}
							showsHorizontalScrollIndicator={false}
						/>
					</View>
				</Animatable.View>

				<Animatable.View
					style={[styles.elementContainer, {width: width - MARGIN * 4}]}
					animation={'fadeInUp'}
					duration={500}
					delay={300}
					useNativeDriver={true}>
					<View style={styles.elementHeader}>
						<Icon type={Icons.Ionicons} name="lock-closed-outline" size={14} color={Colors.black} />
						<CustomText style={styles.elementTitle}>Private Post</CustomText>
					</View>

					<Switch
						style={styles.switch}
						trackColor={{
							false: Colors.white_blur5,
							true: Colors.grape_fruit_blur,
						}}
						thumbColor={privatePost ? Colors.grape_fruit : Colors.white}
						ios_backgroundColor={Colors.white_blur5}
						onChange={() => setPrivatePost(!privatePost)}
						value={privatePost}
					/>
				</Animatable.View>

				<Animatable.View animation={'fadeIn'} duration={500} delay={600} useNativeDriver={true}>
					<Button solid title="POST" style={styles.postButton} onPress={addNewPost} />
				</Animatable.View>
			</ScrollView>

			<View style={styles.wrapperToast}>
				{messages.map((message, index) => (
					<Toast
						key={message.id}
						message={message.content}
						onClose={() => removeToast(message)}
						{...message.type}
					/>
				))}
			</View>
		</SafeAreaView>
	)
}

type HeaderProps = {
	addNewPost: () => void
	goBack: () => void
}

const Header = ({addNewPost, goBack}: HeaderProps) => {
	return (
		<View style={styles.header}>
			<TouchableOpacity onPress={goBack}>
				<Icon type={Icons.Octicons} name="chevron-left" size={34} color={Colors.black} />
			</TouchableOpacity>
			<CustomText style={styles.headerText}>New Post</CustomText>
			<TouchableOpacity onPress={addNewPost}>
				<Icon type={Icons.Octicons} name="check" size={34} color={Colors.black} />
			</TouchableOpacity>
		</View>
	)
}

export default NewPostScreen

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: Platform.OS === 'android' ? 30 : 0,
	},
	elementContainer: {
		padding: PADDING,
		width: width - MARGIN * 2,
		marginHorizontal: MARGIN,
		marginVertical: PADDING,
		borderRadius: 32,
		overflow: 'hidden',
		backgroundColor: Colors.white_blur5,
	},
	elementHeader: {
		marginHorizontal: MARGIN - PADDING,
		flexDirection: 'row',
		alignItems: 'center',
	},
	elementTitle: {
		fontFamily: 'Montserrat-600',
		marginLeft: 8,
	},
	header: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		paddingHorizontal: 24,
		height: 90,
	},
	caption: {
		backgroundColor: Colors.white_blur7,
		borderRadius: 24,
		minHeight: 80,
		maxHeight: 120,
		textAlignVertical: 'top',
		marginTop: MARGIN - PADDING,
	},
	openGalleryButton: {
		width: 84,
		height: 84,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: Colors.white_blur7,
		borderRadius: 28,
		marginRight: 8,
	},
	imagePostCount: {
		fontSize: 12,
		color: Colors.grape_fruit,
		fontFamily: 'Montserrat-700',
	},
	paginationNumber: {
		position: 'absolute',
		top: 17,
		right: MARGIN,
		paddingHorizontal: 6,
		paddingBottom: 1,
		borderRadius: 8,
		backgroundColor: Colors.white_blur7,
	},
	postImage: {
		width: 84,
		height: 84,
		marginHorizontal: 4,
	},
	switch: {
		position: 'absolute',
		top: 12,
		right: PADDING,
	},
	postButton: {
		marginTop: 40,
		marginBottom: 32,
	},
	headerText: {
		color: Colors.grape_fruit,
		fontSize: 24,
		fontFamily: 'Montserrat-600',
		paddingBottom: 5,
	},
	wrapperToast: {
		alignSelf: 'center',
		position: 'absolute',
		bottom: 40,
		left: 24,
		right: 24,
	},
})